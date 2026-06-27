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
