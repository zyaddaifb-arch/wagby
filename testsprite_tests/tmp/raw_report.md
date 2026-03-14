
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Zakerly
- **Date:** 2026-03-14
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Landing page hero renders with Arabic RTL hero text visible
- **Test Code:** [TC001_Landing_page_hero_renders_with_Arabic_RTL_hero_text_visible.py](./TC001_Landing_page_hero_renders_with_Arabic_RTL_hero_text_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/13ef2b98-d208-41b9-818a-b9a4fd948816
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Scroll through landing page sections and confirm features content is visible
- **Test Code:** [TC002_Scroll_through_landing_page_sections_and_confirm_features_content_is_visible.py](./TC002_Scroll_through_landing_page_sections_and_confirm_features_content_is_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/980677a9-e9d2-429b-9ece-eb1f7a7831d4
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Main CTA from landing page routes to signup
- **Test Code:** [TC003_Main_CTA_from_landing_page_routes_to_signup.py](./TC003_Main_CTA_from_landing_page_routes_to_signup.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/6304bd32-1078-47fa-9956-1c74803722f5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Login succeeds and redirects to dashboard
- **Test Code:** [TC006_Login_succeeds_and_redirects_to_dashboard.py](./TC006_Login_succeeds_and_redirects_to_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/43bd9e30-d33e-460a-8e80-a79a02332f00
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Invalid password shows error and stays on login
- **Test Code:** [TC008_Invalid_password_shows_error_and_stays_on_login.py](./TC008_Invalid_password_shows_error_and_stays_on_login.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login did not fail with incorrect credentials: application navigated to /dashboard instead of remaining on /login.
- No error message containing 'Invalid' is visible on the page after submitting wrong credentials.
- The UI does not expose the expected English 'Invalid' error indicator required by the test.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/1ec0206c-38e0-4b4c-8c00-a97547b60777
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Dashboard overview renders for authenticated teacher
- **Test Code:** [TC010_Dashboard_overview_renders_for_authenticated_teacher.py](./TC010_Dashboard_overview_renders_for_authenticated_teacher.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/5d46c136-d34d-429a-8efa-0d0262b4734c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Navigate from dashboard to homework list using in-app navigation
- **Test Code:** [TC011_Navigate_from_dashboard_to_homework_list_using_in_app_navigation.py](./TC011_Navigate_from_dashboard_to_homework_list_using_in_app_navigation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/7fe58c9a-0a0c-4cf2-a338-ab29a91df683
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Homework list page shows empty state when no homeworks exist
- **Test Code:** [TC012_Homework_list_page_shows_empty_state_when_no_homeworks_exist.py](./TC012_Homework_list_page_shows_empty_state_when_no_homeworks_exist.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- URL does not contain "/dashboard/hw"; current URL is "/dashboard".
- Empty-state message indicating there are no homeworks (e.g., "No homeworks") is not present; instead the page lists existing homework items.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/1f415523-2dc0-4783-81b6-bb6460c3d048
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Homework list page shows homework cards when homeworks exist
- **Test Code:** [TC013_Homework_list_page_shows_homework_cards_when_homeworks_exist.py](./TC013_Homework_list_page_shows_homework_cards_when_homeworks_exist.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/028317ac-a6d7-4db1-a206-8385a996ff98
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Empty state CTA navigates to create homework page
- **Test Code:** [TC014_Empty_state_CTA_navigates_to_create_homework_page.py](./TC014_Empty_state_CTA_navigates_to_create_homework_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/f11a490d-aa09-49fd-a372-b9194175a5b6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Create and save a new homework with one multiple-choice question, then verify it appears in homework list
- **Test Code:** [TC016_Create_and_save_a_new_homework_with_one_multiple_choice_question_then_verify_it_appears_in_homework_list.py](./TC016_Create_and_save_a_new_homework_with_one_multiple_choice_question_then_verify_it_appears_in_homework_list.py)
- **Test Error:** Progress update:
- The title 'Homework E2E - MCQ 1' was entered into the title field (index 4672) on the create-homework page at /dashboard/create.
- The create form is visible with title, class dropdown, description, timing, attempts, and navigation buttons present.
Remaining steps (not completed): publish/save the homework and verify it appears on /dashboard/hw. These steps were not executed.
Conclusion: The title input step is complete, but the full end-to-end create/publish/list verification is not finished.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/98481c3e-a46c-4246-b7d5-efdf7c299ac9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Add a multiple-choice question with choices and a correct answer, then Save
- **Test Code:** [TC017_Add_a_multiple_choice_question_with_choices_and_a_correct_answer_then_Save.py](./TC017_Add_a_multiple_choice_question_with_choices_and_a_correct_answer_then_Save.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/62957abf-cfb7-4e60-81c5-805dcc8a5e17
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Complete MCQ fields and Save/Publish, then navigate to Homework list
- **Test Code:** [TC018_Complete_MCQ_fields_and_SavePublish_then_navigate_to_Homework_list.py](./TC018_Complete_MCQ_fields_and_SavePublish_then_navigate_to_Homework_list.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Publish button not found on the create page (/dashboard/create).
- Publish step did not appear after clicking the wizard 'Next' button three times and opening/closing the preview; no publish/save control detected.
- Dashboard homework page (/dashboard/hw) could not be reached because the publish/save action is not available.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/bacc704f-a285-4088-81e9-aa19625a0efc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Validation: attempt to Save with empty title shows title error
- **Test Code:** [TC019_Validation_attempt_to_Save_with_empty_title_shows_title_error.py](./TC019_Validation_attempt_to_Save_with_empty_title_shows_title_error.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/e59cab5f-70fa-41e2-9dac-2c057342c123
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Validation: empty title shows an explicit required message near the title field
- **Test Code:** [TC020_Validation_empty_title_shows_an_explicit_required_message_near_the_title_field.py](./TC020_Validation_empty_title_shows_an_explicit_required_message_near_the_title_field.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/38def951-cc41-4c05-b0dd-c6b589d69205/02c05023-382d-4d51-a208-40c9b38884d9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **73.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---