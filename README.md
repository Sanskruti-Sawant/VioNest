# VioNest

> **Expenses & chores, beautifully managed.**

A modern web application for tracking expenses and managing household chores with an intuitive interface powered by AI. Built with React, TypeScript, Vite, and Google Gemini API.

---

## 🚀 Features

- **Expense Tracking**: Monitor and visualize your spending with beautiful charts and analytics
- **Chore Management**: Organize and delegate household tasks efficiently
- **AI-Powered Insights**: Get intelligent recommendations using Google Gemini API
- **Real-time Dashboard**: View your financial and chores overview at a glance
- **User Authentication**: Secure login and personalized accounts
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark Mode Support**: Easy on the eyes with theme options

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Tailwind Merge
- **Charts**: Recharts
- **Animations**: Motion (framer-motion alternative)
- **Icons**: Lucide React
- **Backend**: Express.js
- **AI**: Google GenAI (Gemini API)
- **Utilities**: date-fns, clsx

---

## 📋 Prerequisites

- Node.js (16+ recommended)
- npm or yarn
- Google Gemini API key

---

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run clean` | Remove the dist folder |
| `npm run lint` | Run TypeScript type checking |

---

## 📁 Project Structure

```
vionest/
├── src/
│   ├── components/
│   │   └── Auth.tsx           # Authentication component
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   ├── types.ts               # TypeScript type definitions
│   ├── constants.ts           # Application constants
│   └── index.css              # Global styles
├── public/
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This file
```

---

## 🚀 Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make changes**: Edit files in the `src/` directory
3. **Type checking**: Run `npm run lint` to verify TypeScript types
4. **Build**: `npm run build` to create a production build
5. **Preview**: `npm run preview` to test the production build locally

---

## 🎨 Styling

This project uses **Tailwind CSS** for styling with custom configuration. Tailwind is pre-configured with:
- Dark mode support
- Custom utility classes
- Responsive design utilities

---

## 🔐 Authentication

The app includes an authentication component (`Auth.tsx`) for user login and account management. Configure OAuth or your preferred authentication method in the Auth component.

---

## 📊 Data Visualization

Charts and analytics are powered by **Recharts**, providing interactive and responsive visualizations for expense tracking and trends.

---

## 🤖 AI Integration

VioNest integrates with the **Google Gemini API** for intelligent features. Make sure your `GEMINI_API_KEY` is properly set in your environment variables.

---

## 🚀 Production Deployment

This project is deployed as two parts:

1. **Frontend** on Vercel
2. **Backend + SQLite database** on Render

### Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add this environment variable in Vercel:
	- `VITE_API_BASE_URL` = your Render backend URL, for example `https://vionest-api.onrender.com`
5. Deploy the project.

### Backend on Render

1. Create a new Render Web Service from the same GitHub repository.
2. Use `npm install` as the build command.
3. Use `npm run start` as the start command.
4. Attach a persistent disk and set `DATABASE_PATH` to `/var/data/vionest.sqlite`.
5. Add these environment variables in Render:
	- `GEMINI_API_KEY`
	- `FRONTEND_ORIGIN` = your Vercel URL, for example `https://your-app.vercel.app`
6. Deploy the service.

### Notes

- The SQLite database is stored on the Render disk, so household data persists across restarts.
- The frontend talks to the backend through `VITE_API_BASE_URL`.
- If you change the Vercel URL later, update `FRONTEND_ORIGIN` in Render.

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
The dev server runs on port 3000 by default. If the port is in use, the server will attempt to use the next available port.

### Missing Environment Variables
Ensure `.env.local` exists and contains your `GEMINI_API_KEY`.

### Build Errors
Run `npm run clean` to remove the dist folder, then try `npm run build` again.

---

## 📝 License

This project is provided as-is. Check with your organization for licensing terms.

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- All type checking passes: `npm run lint`
- Components are documented with comments
- Commits have clear, descriptive messages

---

## 📧 Support

For issues or questions, please refer to the documentation or contact the development team.

---

**Made with ❤️ using React, Vite, and Gemini AI**
