# Chapter 1: User Requirement (Business Requirement)

## 1. Project Overview

### 1.1 Background

CV-VQA-MEDICAL, presented in the current interface as MedVQA, is a university Image Processing course project for exploring medical-image understanding. It combines image-based question answering, image caption generation, and conversational interaction in a controlled web application. Its purpose is academic demonstration and research, not commercial medical service delivery.

Medical images can contain visual information that is difficult to explore through a fixed classification label. A user may instead need to ask a specific question, request a general description, or continue a discussion about the same image. The project supports these activities while organizing results into authenticated user sessions.

The current application provides user accounts, image-based chat, session history, administrator functions, analytics, and configurable conversational AI providers. The checked-in React interface is authoritative; older references to a Streamlit frontend are outdated.

The system is classified as an **educational and research demonstration**. It is not a clinically validated diagnostic system, a regulated medical device, or a substitute for qualified medical judgment.

### 1.2 Purpose

The project provides an academic platform in which an authenticated user can upload an image, ask an image-related question, obtain a generated caption, continue a streamed conversation, revisit earlier sessions, and maintain a profile. Administrators can manage accounts, review sessions, view activity analytics, and configure conversational AI providers. These administrative functions support operation of the university demonstration rather than commercial business activity.

### 1.3 Objectives

| Objective ID | Objective | User/academic value | Acceptance indicator |
|---|---|---|---|
| OBJ-01 | Support medical visual question answering. | Demonstrates combined image and language processing. | A valid image-question request returns an answer or controlled error. |
| OBJ-02 | Generate medical-image captions. | Demonstrates automatic image-to-text description. | A valid image request returns a caption or controlled error. |
| OBJ-03 | Provide conversational image interaction. | Allows follow-up exploration through multiple turns. | A valid chat turn progressively displays output. |
| OBJ-04 | Preserve organized history. | Allows prior academic interactions to be revisited. | Users can reopen owned sessions and view retained messages. |
| OBJ-05 | Protect access. | Reduces unauthorized access to accounts and sessions. | Authentication, role, and ownership rules are enforced. |
| OBJ-06 | Support controlled administration. | Allows the project environment to be managed. | Administrators can access approved management functions. |
| OBJ-07 | Communicate failures and limitations. | Prevents invalid input or unavailable AI from appearing successful. | Failures produce clear errors and no fabricated successful result. |
| OBJ-08 | Support a repeatable academic demonstration. | Helps the team and assessor understand prerequisites. | Required external model files and operating assumptions are documented. |

## 2. Problem Statement

Image-processing prototypes are often exposed as isolated model calls. This does not provide account-based access, continuing conversation, organized history, or separation between normal and administrative activities. It may also communicate limitations inconsistently.

CV-VQA-MEDICAL addresses the need for one controlled interface through which a user can submit an image, ask a natural-language question, receive a caption, and continue an image-related discussion. The affected current users are academic users exploring the system and administrators operating the demonstration environment.

The desired behavior is to validate input, execute an available image-analysis capability, present output or failure clearly, preserve appropriate history, and prevent one normal user from accessing another user’s sessions. The system must not present generated content as verified medical diagnosis.

The boundary includes authentication, profiles, image input, VQA, captioning, conversational sessions, administration, analytics, and provider settings. It excludes clinical diagnosis, treatment decisions, hospital workflow, patient-record integration, regulatory approval, and demonstrated medical-data compliance.

## 3. Stakeholders

| Stakeholder | Classification | Role and interest | Expectations | Main concerns |
|---|---|---|---|---|
| Registered user | Current direct | Uses image analysis, chat, history, and profile functions. | Clear interaction and accessible owned history. | Incorrect output, privacy, usability, availability. |
| Administrator | Current direct | Manages accounts, sessions, analytics, and providers. | Reliable access control and feedback. | Unauthorized access, sensitive content, credentials. |
| Project team | Current indirect | Develops and demonstrates the course project. | Repository/report consistency and reproducibility. | Missing prerequisites and unsupported claims. |
| Lecturer or assessor | Current indirect | Reviews academic objectives and delivered behavior. | Traceable, appropriately scoped evidence. | Excessive clinical claims or unclear scope. |
| System operator | Current indirect | Supplies configuration, model files, and availability. | Observable readiness and diagnosable failures. | Dependencies, hardware, backup, secrets. |
| Clinician or radiologist | Assumption/future | Possible domain reviewer or future specialist user. | Validated modality support and limitations. | Accuracy, bias, liability, confidentiality. |
| Patient or hospital | Future | Possible future data subject or organization. | Consent, privacy, governance, compliance. | Exposure, misuse, unsafe decisions. |
| External AI provider | Current indirect | Supplies configured conversational capability. | Compatible authorized requests. | Availability, transmitted data, credentials. |

## 4. Target Users

### 4.1 Primary User

The verified primary authorization role is **`user`**. It represents an authenticated academic user with basic web-application knowledge and sufficient context to formulate questions about an image. Activities include registration, login, session selection, image upload, questions, streamed interaction, history review, and profile editing. A normal user is limited to owned sessions.

The role does not establish that the user is a clinician, radiologist, patient, or hospital employee. “Clinical user,” “Radiologist,” and specialty text in the interface are presentation/profile text, not authorization roles.

### 4.2 Secondary User

The verified secondary role is **`admin`**. An administrator can perform ordinary user activities and manage account state, review sessions across users, view analytics, and configure settings/providers. Because this role may access user conversations, its use requires an approved governance policy.

### 4.3 Future Users

Clinicians, radiologists, educators, patients, and hospital staff are possible future users only. Supporting them would require separate clinical, privacy, safety, and usability requirements.

## 5. Business Requirements

| BR ID | Business requirement | Rationale | Priority | Acceptance criteria | Evidence status |
|---|---|---|---|---|---|
| BR-01 | The platform shall provide registration, authentication, access renewal, logout, and password change. | Enables controlled continuous access. | Must | Active valid accounts enter protected areas; invalid access is rejected. | Implemented |
| BR-02 | The platform shall distinguish `user` and `admin` permissions. | Prevents unauthorized administration. | Must | A normal user cannot complete an admin operation. | Implemented |
| BR-03 | Users shall maintain permitted profile information and an avatar. | Supports identifiable academic use. | Should | Saved fields appear when the profile is reopened. | Implemented |
| BR-04 | Images shall be validated before analysis. | Prevents invalid or excessive input from being processed. | Must | Non-image, corrupt, or oversized input is rejected clearly. | Implemented |
| BR-05 | Valid image-question requests shall receive VQA processing when ready. | VQA is a principal project objective. | Must | The request returns an answer with available confidence or a controlled error. | Implemented; dedicated page partial |
| BR-06 | Valid images shall receive caption processing when ready. | Captioning demonstrates image-to-text generation. | Must | The request returns a caption or controlled error. | Implemented; dedicated page partial |
| BR-07 | The platform shall support multi-turn streamed conversation. | Supports follow-up exploration and processing feedback. | Should | A valid turn progressively displays content or tool status. | Implemented |
| BR-08 | The platform shall preserve user-owned session history. | Users need to revisit academic work. | Must | An owned session can be reopened with retained messages. | Implemented |
| BR-09 | Users shall create, select, pin, continue, and delete owned sessions. | Users need to organize their work. | Must | Operations affect only owned sessions. | Implemented |
| BR-10 | Administrators shall list, reset, activate, and deactivate eligible accounts. | Supports controlled operation. | Must | Authorized actions update account state; self-deactivation is rejected. | Backend implemented; UI partial |
| BR-11 | Administrators shall review and delete sessions under an approved policy. | Supports oversight. | Should | Admin access succeeds and normal-user access is rejected. | Implemented; policy unresolved |
| BR-12 | Administrators shall view available activity analytics. | Supports academic and operational review. | Should | Aggregate measures are available only to administrators. | Implemented |
| BR-13 | Administrators shall manage and test eligible AI providers without returned clear-text credentials. | Keeps provider use controlled. | Must | Providers can be managed/tested and returned secrets are masked. | Functional; at-rest protection inconsistent |
| BR-14 | The platform shall clearly communicate invalid input, unauthorized access, unavailable capability, and processing failure. | Failure must not resemble successful AI output. | Must | Each failure returns an understandable controlled response. | Implemented |
| BR-15 | AI output shall be presented as informational academic content, not diagnosis or medical advice. | Generated content may be wrong or incomplete. | Must | A limitation notice remains visible during interaction and review. | Prompt partly implements; persistent UI notice proposed |
| BR-16 | Access, retention, and deletion rules shall cover accounts, messages, images, caches, analytics, and logs. | Medical-related content may be sensitive. | Must | An approved lifecycle policy covers every stored category. | Ownership/deletion partial; policy proposed |
| BR-17 | Provider credentials shall be protected consistently at rest and masked in responses. | Prevents secret disclosure. | Must | All stored provider secrets use approved protection. | Masking implemented; storage correction required |
| BR-18 | Supported modalities/languages and uncertainty shall be disclosed. | Generic image acceptance does not prove reliable domain support. | Must | Unsupported use is refused or clearly labelled. | Proposed; team confirmation required |

## 6. Functional Requirements

| FR ID | Functional requirement | Actor | Expected output | Priority | Status |
|---|---|---|---|---|---|
| FR-01 | The system shall register an account with unique username, unique valid email, and valid password. | Visitor | Account or validation error. | Must | Implemented |
| FR-02 | The system shall authenticate active accounts and renew access using a valid non-revoked credential. | User/admin | Authorized access or denial. | Must | Implemented |
| FR-03 | The system shall revoke submitted valid credentials on logout for their remaining lifetime. | User/admin | Logout confirmation. | Must | Implemented |
| FR-04 | The system shall enforce mandatory password change after administrative reset. | User/admin | Changed password or access restriction. | Must | Implemented |
| FR-05 | The system shall enforce `user` and `admin` permissions. | User/admin | Authorized result or forbidden response. | Must | Implemented |
| FR-06 | The system shall allow viewing/editing permitted profile fields and a validated avatar. | User/admin | Updated profile or error. | Should | Implemented |
| FR-07 | The system shall create, list, select, pin, review, continue, and delete owned sessions. | User/admin | Updated owned session state. | Must | Implemented |
| FR-08 | The system shall prevent normal users from accessing another user’s session. | User | Access denial. | Must | Implemented |
| FR-09 | The system shall accept text, a valid image, or both for chat and reject empty submission. | User/admin | Accepted turn or validation error. | Must | Implemented |
| FR-10 | The system shall validate image type, configured size, and decodability. | User/admin | Accepted image or rejection. | Must | Implemented |
| FR-11 | The system shall answer a valid question about a valid image when VQA is ready. | User/admin | Answer/confidence or controlled error. | Must | Implemented; dedicated UI partial |
| FR-12 | The system shall caption a valid image when captioning is ready. | User/admin | Caption or controlled error. | Must | Implemented; dedicated UI partial |
| FR-13 | The system shall progressively display conversational content and tool events. | User/admin | Streamed response or error. | Should | Implemented |
| FR-14 | The system shall retain messages, image references, titles, timestamps, and ownership. | User/admin | Reopenable history. | Must | Implemented |
| FR-15 | The system shall remove a deleted chat session and associated chat images. | User/admin | Removed session/history. | Must | Implemented |
| FR-16 | The system shall allow admins to list, activate, deactivate, and reset eligible accounts. | Admin | Updated account state or error. | Must | Backend implemented; UI partial |
| FR-17 | The system shall allow admins to list, inspect, filter, and delete sessions across users. | Admin | Session information/result. | Should | Implemented |
| FR-18 | The system shall provide activity analytics only to administrators. | Admin | Aggregate analytics or denial. | Should | Implemented |
| FR-19 | The system shall allow admins to manage, select, test, and query eligible AI providers while masking credentials. | Admin | Provider/model/connection result. | Must | Partly implemented securely |
| FR-20 | The system shall distinguish service health from model readiness. | Operator | Clear status. | Must | Implemented |
| FR-21 | The system shall display persistent non-diagnostic and supported-use notices with AI interaction/output. | User/admin | Visible limitation notice. | Must | Proposed; prompt-only notice exists |

Forgot-password recovery is not implemented. A visual link exists, but no connected recovery workflow is present.

## 7. Non-functional Requirements

No numerical response-time, availability, accuracy, or capacity value is assumed. Where a threshold is required, it remains subject to project-team approval.

| NFR ID | Category | Requirement | User or project rationale | Evidence/metric status |
|---|---|---|---|---|
| NFR-01 | Usability | Forms, image selection, progress, history, and errors shall be understandable without specialist technical knowledge. | Users need to complete principal workflows without interpreting internal behavior. | Partly implemented; target usability measure is undefined. |
| NFR-02 | Performance | The system shall provide progressive feedback and avoid unnecessary repeated processing where supported. | Users need visible progress and reasonable repeated interaction. | Relevant behavior is implemented; timing target is undefined. |
| NFR-03 | Reliability | Invalid input and unavailable AI capabilities shall not produce a fabricated successful result. | Controlled failure is safer than misleading output. | Implemented. |
| NFR-04 | Availability | Operators shall be able to determine whether the application is available for image analysis. | Demonstrations should not begin while required capabilities are unavailable. | Implemented; availability target is undefined. |
| NFR-05 | Security | Protected operations shall require valid authentication, active account state, appropriate role, and session ownership. | Accounts and user content require controlled access. | Implemented; formal security standard is undefined. |
| NFR-06 | Privacy | Potentially sensitive images, messages, profiles, logs, and analytics shall follow an approved access, retention, deletion, and disclosure policy. | Medical-related content may contain sensitive information. | Proposed; retention periods are undefined. |
| NFR-07 | Maintainability | Requirements documentation shall remain consistent with current user-visible behavior. | Inconsistency weakens the academic report. | Inferred requirement. |
| NFR-08 | Scalability | Future capacity changes shall not alter defined user-visible contracts without requirement approval. | Growth should preserve expected user behavior. | Inferred; capacity target is undefined. |
| NFR-09 | Compatibility | The application shall operate on team-approved contemporary browsers and accepted image formats. | Users and assessors need a known compatible environment. | Chromium is evidenced; complete matrix is unconfirmed. |
| NFR-10 | Portability | The project shall be demonstrable on a documented supported environment when external prerequisites are supplied. | The course project should be repeatable outside one developer machine. | Partly documented; supported environment is unconfirmed. |
| NFR-11 | Accessibility | Essential authentication, image interaction, history, profile, and administration functions shall be keyboard-operable and meaningfully labelled. | Core workflows should not depend exclusively on pointer interaction or visual icons. | Partly implemented; target accessibility level is undefined. |
| NFR-12 | Safety | Non-diagnostic status, supported use, uncertainty, and need for qualified review shall be communicated consistently. | Users must not over-rely on generated medical content. | Proposed; conversational prompt provides partial support. |
| NFR-13 | Operational transparency | Operators shall receive sufficient status and error information to recognize unavailable required capabilities. | Controlled academic operation requires visible failure state. | Implemented; escalation criteria are undefined. |
| NFR-14 | Reproducibility | Required dependencies, configuration, model provenance, and demonstration assumptions shall be documented without exposing live secrets. | The work should be repeatable and assessable. | Partly satisfied; model weights are absent. |

## 8. User Stories

| ID | User story | Priority | Status |
|---|---|---|---|
| US-01 | As a visitor, I want to register, so that I can access protected image-analysis functions. | Must | Implemented |
| US-02 | As a user, I want to log in and renew access, so that I can continue authorized use. | Must | Implemented |
| US-03 | As a user, I want to log out, so that my credentials are revoked. | Must | Implemented |
| US-04 | As a reset user, I want to change my password, so that only I know it. | Must | Implemented |
| US-05 | As a user, I want to edit my profile and avatar, so that they reflect my information. | Should | Implemented |
| US-06 | As a user, I want invalid images rejected clearly, so that I can correct them. | Must | Implemented |
| US-07 | As a user, I want to question an image, so that I can explore visual information. | Must | Implemented |
| US-08 | As a user, I want an image caption, so that I receive an initial description. | Must | Implemented; dedicated page partial |
| US-09 | As a user, I want streamed responses, so that I know processing continues. | Should | Implemented |
| US-10 | As a user, I want to reopen sessions, so that I can preserve context. | Must | Implemented |
| US-11 | As a user, I want to delete owned sessions/images, so that I control history. | Must | Implemented for chat |
| US-12 | As an admin, I want to manage accounts, so that I can control access. | Must | Backend implemented; UI partial |
| US-13 | As an admin, I want to review sessions, so that I can support governed operation. | Should | Implemented; policy unresolved |
| US-14 | As an admin, I want activity analytics, so that I understand usage. | Should | Implemented |
| US-15 | As an admin, I want to configure/test providers, so that an approved provider is used. | Must | Partly secure |
| US-16 | As a user, I want errors and limitations, so that I do not mistake output for medical fact. | Must | Partly implemented |

## 9. Use Cases

| UC ID | Use case | Actor | Preconditions | Main flow | Exceptions | Postcondition | Status |
|---|---|---|---|---|---|---|---|
| UC-01 | Register account | Visitor | Not authenticated | Submit username, email, password; validate; create `user`; authenticate. | Invalid/duplicate data is rejected. | Account and access exist, or nothing is created. | Implemented |
| UC-02 | Authenticate, change password, or log out | User/admin | Active account for login; authenticated session for password change or logout | Submit credentials and receive access; change a temporary password when required; submit logout when finished. | Incorrect, inactive, expired, or revoked credentials are rejected. | Actor enters authorized use, changes a required password, ends the session, or remains unauthenticated after failure. | Implemented |
| UC-03 | Create/select session | User/admin | Authenticated | List owned sessions; create/select one; display history. | Missing/non-owned session is rejected. | An owned session is active. | Implemented |
| UC-04 | Upload image | User/admin | Applicable interaction open | Select image; validate type, size, decoding; accept for processing. | Invalid/oversized/corrupt file is rejected. | Valid image proceeds or no analysis occurs. | Implemented; modality list unconfirmed |
| UC-05 | Ask about image | User/admin | Valid image/question; VQA ready | Submit and validate the request; perform VQA; present the answer and available confidence. | Empty/long question, absent image, unavailable model, or failure is reported. | Answer or controlled failure is presented. | Implemented; dedicated page partial |
| UC-06 | Generate caption | User/admin | Valid image; captioning ready | Submit and validate the image; generate and present a caption. | Invalid image, unavailable model, or failure is reported. | Caption or controlled failure is presented. | Implemented; dedicated page partial |
| UC-07 | Continue/delete history | User/admin | Owned session exists | Verify ownership; show history; continue, pin, or delete. | Non-owned/missing session is rejected. | History remains/extends or is deleted with chat images. | Implemented |
| UC-08 | Update profile | User/admin | Authenticated | Edit fields/avatar; validate; save; redisplay. | Invalid avatar or service failure is reported. | Profile updates or remains unchanged. | Implemented |
| UC-09 | Manage accounts | Admin | Active admin | List account; activate, deactivate, or reset. | Non-admin, missing account, self-deactivation rejected. | Account state updates or remains unchanged. | Backend implemented; UI partial |
| UC-10 | Review sessions and analytics | Admin | Active admin and approved policy | Open the relevant view; filter information; inspect analytics or a session; optionally delete a session. | Invalid identifier, unavailable data, or non-admin access is rejected. | Information is reviewed; a selected session may be removed. | Implemented; policy unresolved |
| UC-11 | Configure provider | Admin | Approved provider details | Create/edit; select default; test; retrieve models; mask returned secret. | Duplicate, invalid, unreachable, or default deletion rejected. | Provider available or prior state retained. | Functional; storage correction required |

## 10. Project Scope

### 10.1 In Scope

| Capability | Status |
|---|---|
| Authentication and password change | Implemented |
| `user` and `admin` roles | Implemented |
| Profile/avatar management | Implemented |
| Medical-image chat and streaming | Implemented |
| VQA and caption generation | Implemented; dedicated pages partial |
| Session history and user session controls | Implemented |
| User/session administration | Implemented; some UI actions partial |
| Administrative analytics | Implemented |
| AI-provider configuration | Implemented with credential gap |
| Health, readiness, and error feedback | Implemented |

### 10.2 Out of Scope

| Capability | Decision |
|---|---|
| Clinical diagnosis, treatment, or autonomous decisions | Not supported |
| Hospital workflow, EHR, or PACS integration | Not implemented |
| Patient identity and consent management | Not implemented |
| Regulatory approval | Not established |
| Demonstrated HIPAA/GDPR compliance | Not established |
| Native mobile application | Not implemented |
| Model training/dataset management interface | Not implemented |
| Formal clinician approval workflow | Not implemented |
| Password recovery/email verification | Not implemented |

## 11. Constraints

| ID | Constraint | Classification | Impact/required action |
|---|---|---|---|
| CON-01 | Required VQA/caption weights are absent. | Verified | Approved external files, provenance, integrity, and licensing are required. |
| CON-02 | Pretrained assets may require external availability. | Verified | Approved compatible versions must be documented. |
| CON-03 | Image analysis depends on a compatible processing environment. | Verified | The target demonstration environment must be confirmed. |
| CON-04 | Images have a configured size limit. | Verified | Active limit should be displayed consistently. |
| CON-05 | Direct VQA questions have a configured length limit. | Verified | Active limit should be communicated. |
| CON-06 | Sessions and recent AI context have limits. | Verified | Long-session behavior must be disclosed. |
| CON-07 | No medical-modality allowlist is enforced. | Verified gap | Supported modalities require approval and disclosure. |
| CON-08 | Language expectations conflict. | Team confirmation | VQA/chat language support must be defined separately. |
| CON-09 | Account, session, access-revocation, and image functions depend on supporting services. | Verified | Backup and degraded-operation expectations are required. |
| CON-10 | Full chat requires a compatible provider. | Verified | Fallback expectations must be confirmed. |
| CON-11 | Browser evidence primarily covers Chromium. | Verified | Browser matrix must be approved. |
| CON-12 | No clinical validation/regulatory approval exists. | Verified | Maintain non-diagnostic academic classification. |
| CON-13 | Example configuration contains unsafe defaults. | Verified | Replace them in shared environments; do not expose values. |
| CON-14 | README conflicts with current React implementation. | Verified | Source is authoritative; update older documentation separately. |

## 12. Risks

| ID | Risk | Likelihood | Impact | Existing mitigation | Required mitigation |
|---|---|---|---|---|---|
| RISK-01 | Incorrect medical answer/caption | High | Critical | Validation and available confidence | Evaluation, thresholds, notice, qualified review |
| RISK-02 | LLM hallucination | High | High | Prompt requests tool grounding | Enforced grounding and refusal |
| RISK-03 | Unsupported modality | Medium | High | Basic file validation | Modality list and enforcement |
| RISK-04 | Unsupported language/question | Medium | High | Empty/length checks | Supported-domain contract |
| RISK-05 | Provider outage | Medium | High | Connection test/errors | Fallback/degraded mode |
| RISK-06 | Missing model weights | High | High | Readiness state | Controlled distribution/integrity |
| RISK-07 | Unauthorized access | Medium | High | Authentication, roles, ownership | Security review/monitoring |
| RISK-08 | Sensitive image exposure | High | Critical | Authentication, scoped links, session deletion | De-identification, retention, audit |
| RISK-09 | Credential exposure | Medium | Critical | Masking/partial encryption | Secret management and rotation |
| RISK-10 | Data/storage failure | Medium | High | Errors/status | Backup, restore, reconciliation |
| RISK-11 | Output used as diagnosis | High | Critical | Prompt disclaimer | Persistent warning/use policy |
| RISK-12 | Outdated documentation | High | Medium | Source remains available | One authoritative reviewed report |
| RISK-13 | Orphaned direct-inference uploads | Medium | High | User-scoped naming | Lifecycle link or avoid retention |
| RISK-14 | Sensitive logging | Medium | High | No formal mitigation verified | Redaction/access/retention policy |
| RISK-15 | Inconsistent provider-secret encryption | Medium | Critical | Response masking | Encrypt, migrate, rotate |
| RISK-16 | Supporting-service failure affects access revocation | Medium | High | Expiring access credentials | Defined fail-safe policy and monitoring |
| RISK-17 | Unsupported compliance/medical-grade claims | High | High | None established | Remove or formally substantiate |

## 13. Future Work

The following are future directions, not current capabilities:

1. Validate and enforce approved medical-image modalities.
2. Evaluate explicitly supported multilingual VQA and chat behavior.
3. Introduce confidence-aware refusal and escalation.
4. Add a permanent non-diagnostic safety notice.
5. Add a governed domain-expert review workflow.
6. Implement password recovery and email verification.
7. Add account deletion, data export, and retention controls.
8. Encrypt and govern every provider secret consistently.
9. Correct outdated documentation and maintain traceability.
10. Conduct formal domain evaluation and document datasets, limitations, and failure cases.
11. Consider educational or hospital integration only after separate governance review.
12. Add a mobile client, model-training tools, or dataset-management tools only as separately approved extensions.

Each future item requires separate requirements, ethical review, implementation, and evaluation before it can be reported as available.
