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

class ViT_GPT2_Captioning(nn.Module):
    def __init__(self, vit, gpt2, vocab_size):
        super().__init__()
        self.vit = vit
        self.gpt2 = gpt2
        
        # Freeze ViT
        for param in self.vit.parameters():
            param.requires_grad = False
            
        # Projection: ViT 768d -> GPT-2 768d
        self.projection = nn.Sequential(
            nn.Linear(768, 768),
            nn.LayerNorm(768),
            nn.GELU()
        )

    def forward(self, pixel_values, input_ids, attention_mask, labels=None):
        # Visual feature
        with torch.no_grad():
            img_feat = self.vit(pixel_values).last_hidden_state[:, 0, :]
            
        # Project
        img_proj = self.projection(img_feat).unsqueeze(1)  # (B, 1, 768)
        
        # GPT-2 embeddings
        token_embeds = self.gpt2.transformer.wte(input_ids)  # (B, L, 768)
        inputs_embeds = torch.cat([img_proj, token_embeds], dim=1)  # (B, L+1, 768)
        
        # Extend attention mask for the visual token
        device = attention_mask.device
        extended_mask = torch.cat([
            torch.ones(attention_mask.size(0), 1).to(device),
            attention_mask
        ], dim=1)
        
        outputs = self.gpt2(
            inputs_embeds=inputs_embeds,
            attention_mask=extended_mask
        )
        
        logits = outputs.logits[:, 1:, :]  # remove visual token from logits
        loss = None
        if labels is not None:
            loss = nn.CrossEntropyLoss(ignore_index=-100)(
                logits.reshape(-1, logits.size(-1)),
                labels.reshape(-1)
            )
        return loss, logits
