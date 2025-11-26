# employee-payroll-systememployee-payroll-system/
│
├── frontend/               # React frontend
│   ├── public/             # Static files (index.html, favicon)
│   ├── src/
│   │   ├── assets/         # Images, icons, styles
│   │   ├── components/     # Reusable UI components (Navbar, Sidebar, Cards)
│   │   ├── pages/          # Page-level views (Dashboard, Profile, Payments)
│   │   ├── services/       # API calls (axios setup)
│   │   ├── context/        # Auth and global state
│   │   ├── utils/          # Helper functions
│   │   └── App.js          # Main app entry
│   └── package.json
│
├── backend/                # Node.js + Express backend
│   ├── controllers/        # Business logic (employee, admin, payroll)
│   ├── models/             # Mongoose or Sequelize schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, role-based access
│   ├── config/             # DB connection, environment setup
│   ├── utils/              # Payroll calculator, invoice generator
│   └── server.js           # Main server entry
│
├── .env                    # Environment variables
├── README.md               # Project overview
├── docs/                   # Diagrams, thesis notes, screenshots
│   ├── architecture/
│   ├── wireframes/
│   └── thesis-outline.docx
├── database/               # SQL scripts or Mongo seed files
│   └── schema.sql
├── logs/                   # Server logs (optional)
└── package.json            # Root-level (optional if separate frontend/backend installs)





![alt text](image.png)

### 3.2 Use Case Diagrams

```mermaid
graph TD
    %% Actors
    A[Admin]:::actor
    H[HR Manager]:::actor
    E[Employee]:::actor
    C[Accountant]:::actor

    %% System Boundary
    subgraph System["PayWeb System"]
        L[Login]:::usecase
        CI[Clock In/Out]:::usecase
        AL[Apply Leave]:::usecase
        RL[Run Payroll]:::usecase
        VP[View Payslip]:::usecase
        AL -->|<<extend>>| AL_Approve[Approve/Reject Leave]:::usecase
    end

    %% Connections
    A --> L
    A --> RL
    A --> VP

    H --> L
    H --> CI
    H --> AL_Approve
    H --> RL
    H --> VP

    E --> L
    E --> CI
    E --> AL
    E --> VP

    C --> L
    C --> RL
    C --> VP

    %% Styling
    classDef actor fill:#e1f5fe,stroke:#333,stroke-width:2px,color:#000,font-weight:bold;
    classDef usecase fill:#fff2e6,stroke:#333,stroke-dasharray: 5 5,rx:25,ry:25,color:#000;