# Medical Image Captioning Integration Plan

## Goal
Integrate the ROCO-trained Medical Image Captioning model (ViT + GPT-2) into the existing FastAPI backend alongside the VQA system.

## Context
The system currently supports VQA. We need to add captioning capabilities reusing the existing ViT backbone where possible to optimize resource usage.

## Proposal

1. **Configuration**: Update env paths for the new ROCO weights.
2. **Architecture**: Implement `ViT_GPT2_Captioning` merging ViT backbone with GPT-2 decoder.
3. **Pipeline**: Update inference to share the ViT model between VQA and Captioning. Add autoregressive generation.
4. **API**: Define `CaptionResponse` schema and add a `POST /api/v1/caption` endpoint.
