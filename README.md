# Specialized V2 - Assessment & Certification Platform

A comprehensive React-based frontend application for role-based skills assessment, quiz generation, and certification. This platform allows users to select specific roles (e.g., Backend Engineer), take assessments, view detailed results, and download certificates upon successful completion and payment.

## 🚀 Features

- **Dynamic Role Pages**: Custom landing pages based on user roles (e.g., `/?role=Backend Engineer`).
- **Interactive Assessment**: Quiz interface with progress tracking and timer.
- **Skills Selection**: Users can choose specific skills relevant to their role to be tested on.
- **Instant Results & Analytics**: Detailed performance breakdown and AI-generated summaries.
- **Certificate Generation**: Automated PDF certificate generation using `html2canvas` and `jspdf`.
- **Payment Integration**: Seamless flow from assessment to payment and certificate delivery.
- **Responsive Design**: Built with Tailwind CSS for a fully responsive experience across devices.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: `jspdf`, `html2canvas`, `@react-pdf/renderer`
- **Analytics**: `mixpanel-browser`

## 📂 Project Structure

```bash
src/
├── components/   # Reusable UI components (Hero, Buttons, Cards, etc.)
├── pages/        # Main route pages (Homepage, RolePage, AssessmentPage, etc.)
├── services/     # API integration and analytics services
├── types/        # TypeScript type definitions
├── utils/        # Helper functions (localStorage, PDF generation, URL params)
└── App.tsx       # Main application component and routing configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/trojan5x/specialised_v2.git
    cd specialised_v2/frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🧪 Key Workflows

1.  **Landing**: Users arrive at `/?role=...` or the homepage.
2.  **Skill Selection**: Users pick skills to test.
3.  **Assessment**: Users answer questions generated for their selected skills.
4.  **Results**: Users see their score and summary.
5.  **Payment**: Users purchase their certificate.
6.  **Success**: Detailed certificate download page.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
