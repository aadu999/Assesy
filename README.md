# Assesy: A Dynamic Platform for Conducting Coding Assessments

Assesy is a comprehensive, containerized platform designed to streamline the technical interview process. It empowers administrators to create, manage, and distribute coding assessments seamlessly. For candidates, it provides an isolated and fully-equipped development environment, ensuring a fair and consistent evaluation experience.

-----

### **Key Features**

  * **Dynamic, Isolated Environments:** Each candidate receives a fresh, containerized VS Code environment, pre-loaded with the necessary assessment files. This eliminates the "works on my machine" problem and ensures a level playing field.
  * **Centralized Administration:** A user-friendly admin dashboard allows for the creation of new assessments, generation of unique interview links, and a comprehensive overview of all active and completed sessions.
  * **In-depth Submission Review:** Administrators can review candidate submissions directly within the platform. The system allows for viewing individual files, downloading the entire project as a ZIP archive, and even re-launching the submitted code in a sandboxed review environment.
  * **Extensible and Customizable:** The platform is built with extensibility in mind. The VS Code environments can be customized with specific extensions and configurations to suit the needs of any technical assessment.

-----

### **Installation and Deployment**

Deploying Assesy is a straightforward process, thanks to its containerized architecture.

#### **Prerequisites**

  * **Docker and Docker Compose:** The entire platform is orchestrated using Docker Compose. Ensure you have both installed and running on your system.
  * **Node.js and npm:** Required for the backend service.

#### **Configuration**

1.  **Backend Environment:** Before launching the application, you'll need to configure the backend service. Navigate to the `backend` directory and create a `.env` file. This file will store your database credentials and other environment-specific variables.

2.  **Docker Compose:** The `docker-compose.yml` file is the heart of the deployment process. It defines all the services that make up the Assesy platform:

      * `backend`: The Node.js application that powers the platform's core logic.
      * `database`: A PostgreSQL instance for data persistence.
      * `traefik`: A reverse proxy that manages incoming traffic and routes it to the appropriate service.
      * `admin-frontend`: The web interface for administrators.

#### **Build and Launch**

1.  **Build the services:** From the root of the project directory, run the following command to build all the necessary Docker images:

    ```bash
    docker-compose build
    ```

2.  **Start the application:** Once the build process is complete, you can launch the entire platform with a single command:

    ```bash
    docker-compose up -d
    ```

#### **Accessing the Platform**

  * **Admin Panel:** The administrative dashboard can be accessed at `http://admin.interview.localhost`. The default credentials are:
      * **Username:** admin
      * **Password:** password
  * **Candidate Environments:** When a new assessment is created, a unique link is generated. This link will direct the candidate to their sandboxed VS Code environment.

-----

### **Support**

If you find this project helpful, consider supporting its development:

\<a href="[https://buymeacoffee.com/adarshr](https://buymeacoffee.com/adarshr)"\>
\<img src="[https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge\&logo=buy-me-a-coffee\&logoColor=black](https://www.google.com/search?q=https://img.shields.io/badge/Buy%2520Me%2520a%2520Coffee-ffdd00%3Fstyle%3Dfor-the-badge%26logo%3Dbuy-me-a-coffee%26logoColor%3Dblack)" alt="Buy Me a Coffee"\>
\</a\>

-----

### **Future Works**

Assesy is a powerful platform, but there's always room for improvement. Here are some potential future enhancements:

  * **Support for Multiple Assessment Types:** Extend the platform to support various assessment formats, such as multiple-choice questions, Q\&A sections, and system design challenges.
  * **Real-time Collaboration:** Implement a chat or video conferencing feature to allow for real-time communication between the candidate and the interviewer.
  * **Automated Test Cases:** Integrate a testing framework to automatically run predefined test cases against the candidate's submission, providing instant feedback and a preliminary score.
  * **Role-Based Access Control (RBAC):** Introduce a more granular permission system for the admin panel, allowing for different levels of access for various user roles (e.g., admin, interviewer, recruiter).
