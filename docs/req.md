# 1. Purpose

- In this test, we would like to evaluate your backend technical skills.
  - Implement secure authentication with role-based access.
  - Deliver correct core business logic for task management.
  - Produce clean, maintainable, production-minded code within time constraints.
- This test reflects a realistic mobile-app MVP scenario, not an academic algorithm exercise.
- Node.js is the preferred runtime, though equivalent approaches in similar ecosystems may still be considered.

# 2. Test Duration

- Total duration: 3.5 hours.
- The limited timeframe is intended to:
  - Validate practical engineering decision-making.
  - Observe prioritization under time pressure.
  - Prevent over-engineering.

# 3. Scope

- Build a minimal runnable backend service that supports:
  - Authentication.
  - Role-based authorization.
  - Basic task management workflow.
- Out of scope:
  - UI or frontend.
  - Deployment or infrastructure setup.
  - Advanced architecture or scalability concerns.

# 4. Functional Expectations

## 4.1 Roles

- The system must include two user roles:
  - **Admin**
    - Can manage user roles.
    - Can assign tasks.
    - Can access the full task list.
  - **Worker**
    - Can only view tasks assigned to them.
    - Cannot assign tasks or modify roles.

## 4.2 Authentication

- Support standard mobile-app authentication behavior, including:
  - User registration and login.
  - Secure password handling.
  - Token-based session or equivalent.
  - Protection of restricted operations.
  - Enforcement of role permissions.
- Implementation details and structure are left to the candidate’s discretion.

## 4.3 Task Management

- Enable a basic task lifecycle, including:
  - Creation of tasks.
  - Assignment of tasks to users.
  - Retrieval of tasks based on requester role.
- Exact API design, schema structure, and extended behaviors are not prescribed to allow evaluation of design judgment.

# 5. Non-Functional Expectations

- Submissions should demonstrate:
  - Clear and understandable project organization.
  - Sensible handling of invalid input or unauthorized access.
  - Readable, maintainable code suitable for real-world projects.
  - Minimal documentation explaining how to run and test locally.

# 6. Deliverables

- A valid submission must include:
  - Source code that runs locally.
  - A brief README with setup instructions.
  - Simple examples of interacting with the service.
- Deployment is not required.

# 7. Evaluation Principles

- Assessment will focus on:
  - Correctness of authentication and authorization behavior.
  - Accuracy of role-based task visibility and assignment.
  - Code clarity and maintainability.
  - Practical engineering judgment within limited time.
- Highly prescriptive structure or excessive boilerplate is not expected.
