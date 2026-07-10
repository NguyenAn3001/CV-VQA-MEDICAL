## ADDED Requirements

### Requirement: Tool call argument serialization
The system MUST correctly serialize tool call arguments when appending them to the message history, preventing double-encoding if the arguments are already strings.

#### Scenario: Appending assistant tool calls
- **WHEN** the LLM orchestrator appends the assistant's tool call to the message array
- **THEN** it must ensure the arguments are valid JSON strings, parsing and re-dumping only if they are not already strings.

### Requirement: Multi-turn tool synthesis
The system MUST correctly synthesize a final answer after executing tools, returning this synthesis to the user.

#### Scenario: Synthesizing an answer after VQA
- **WHEN** the LLM uses the VQA tool to get an answer about an image
- **THEN** the orchestrator must append the tool's result to the message history and invoke the LLM provider a second time
- **AND THEN** the LLM provider must successfully receive this context, generate a final conversational answer, and stream it back to the user.