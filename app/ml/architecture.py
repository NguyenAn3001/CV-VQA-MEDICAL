import torch
import torch.nn as nn

class ViT_PubMedBERT_VQA(nn.Module):
    def __init__(self, vit, bert, num_answers):
        super().__init__()
        self.vit  = vit
        self.bert = bert

        # Freeze the backbone networks
        for param in self.vit.parameters():
            param.requires_grad = False
        for param in self.bert.parameters():
            param.requires_grad = False

        self.fusion = nn.Sequential(
            nn.Linear(768 + 768, 1024),
            nn.LayerNorm(1024),
            nn.GELU(),
            nn.Dropout(0.4),
            nn.Linear(1024, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_answers)
        )

    def forward(self, pixel_values, input_ids, attention_mask):
        # We don't need gradients for inference, but let's keep it safe inside the forward pass
        img_feat  = self.vit(pixel_values).last_hidden_state[:, 0, :]
        text_feat = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask
        ).last_hidden_state[:, 0, :]

        fused = torch.cat([img_feat, text_feat], dim=-1)
        return self.fusion(fused)

class CrossAttentionFusion(nn.Module):
    def __init__(self, embed_dim=768, num_heads=8, num_visual_tokens=8):
        super().__init__()
        self.num_visual_tokens = num_visual_tokens
        
        # We learn N query tokens to extract information from the image
        self.visual_queries = nn.Parameter(torch.randn(1, num_visual_tokens, embed_dim))
        
        # Project image features if needed (here we assume 768->768)
        self.visual_proj = nn.Sequential(
            nn.Linear(embed_dim, embed_dim),
            nn.LayerNorm(embed_dim)
        )
        
        # Cross Attention: queries attend to image features
        self.cross_attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        
        # FFN
        self.norm2 = nn.LayerNorm(embed_dim)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, embed_dim * 4),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(embed_dim * 4, embed_dim)
        )

    def forward(self, image_features):
        B = image_features.size(0)
        # image_features: (B, num_patches, embed_dim)
        
        # Project image features
        img_proj = self.visual_proj(image_features)
        
        # Expand queries for batch
        queries = self.visual_queries.expand(B, -1, -1)
        
        # Cross attention
        attn_out, _ = self.cross_attn(queries, img_proj, img_proj)
        x = self.norm1(queries + attn_out)
        
        # FFN
        ffn_out = self.ffn(self.norm2(x))
        x = x + ffn_out
        
        return x  # (B, num_visual_tokens, embed_dim)

class ViT_GPT2_Captioning(nn.Module):
    def __init__(self, vit, gpt2, vocab_size, num_visual_tokens=8):
        super().__init__()
        self.vit = vit
        self.gpt2 = gpt2
        self.num_visual_tokens = num_visual_tokens
        
        # Freeze ViT
        for param in self.vit.parameters():
            param.requires_grad = False
            
        # Instead of simple projection, use the fusion module found in weights
        self.fusion = CrossAttentionFusion(
            embed_dim=768, 
            num_heads=8, 
            num_visual_tokens=num_visual_tokens
        )

    def forward(self, pixel_values, input_ids, attention_mask, labels=None):
        # Visual feature
        with torch.no_grad():
            # Get full sequence of patches, not just CLS token
            img_feat = self.vit(pixel_values).last_hidden_state  # (B, 197, 768)
            
        # Project/Fuse to get visual tokens
        img_tokens = self.fusion(img_feat)  # (B, num_visual_tokens, 768)
        
        # GPT-2 embeddings
        token_embeds = self.gpt2.transformer.wte(input_ids)  # (B, L, 768)
        inputs_embeds = torch.cat([img_tokens, token_embeds], dim=1)  # (B, L+num_visual_tokens, 768)
        
        # Extend attention mask for the visual tokens
        device = attention_mask.device
        extended_mask = torch.cat([
            torch.ones(attention_mask.size(0), self.num_visual_tokens).to(device),
            attention_mask
        ], dim=1)
        
        outputs = self.gpt2(
            inputs_embeds=inputs_embeds,
            attention_mask=extended_mask
        )
        
        # Remove visual tokens from logits
        logits = outputs.logits[:, self.num_visual_tokens:, :]  
        
        loss = None
        if labels is not None:
            loss = nn.CrossEntropyLoss(ignore_index=-100)(
                logits.reshape(-1, logits.size(-1)),
                labels.reshape(-1)
            )
        return loss, logits
