# Zoom Clone 🚀 - A Project by Utsav Patel

<img src="public/Screenshot 2024-06-24 183450.png" style="border-radius:20px;" alt="Project Screenshot">

A feature-rich Zoom clone built with modern technologies such as TypeScript, Next.js, Tailwind CSS, Shadcn, GetStream, Clerk, and Node.js.

## Features ✨

- 🔒 User Authentication with Clerk
- 💬 Real-time messaging with GetStream
- 📹 Video conferencing
- 📱 Responsive UI with Tailwind CSS
- ⚡ Server-side rendering with Next.js
- 🚀 Deployment: Deployed using Vercel for seamless deployment and hosting.

## Tech Stack 🛠️

- **Frontend**: TypeScript, Next.js, Tailwind CSS, Shadcn
- **Backend**: Node.js
- **Authentication**: Clerk
- **Real-time Messaging**: GetStream
- **Deployment**: Vercel

### Prerequisites ✅

- Node.js (v14.x or later)
- npm or yarn

### Steps 📝

1. **Clone the repository:**

   ```bash
   git clone https://github.com/utsavpatel562/zoom-clone.git
   cd zoom-clone
   ```

### Install dependencies 📦

```bash
npm install
# or
yarn install
```

### Set up environment variables

Create a .env.local file in the root directory and add the following variables:

```bash
NEXT_PUBLIC_CLERK_FRONTEND_API=your-clerk-frontend-api
CLERK_API_KEY=your-clerk-api-key
STREAM_API_KEY=your-getstream-api-key
STREAM_API_SECRET=your-getstream-api-secret
```

### Usage 🚀

User Authentication 🔐
- Sign up or log in using Clerk for user authentication.

Messaging
- Real-time messaging is enabled using GetStream.

Video Conferencing
- Start or join a video call session.

### Project Structure 🗂️

```bash
.
├── components    # Reusable UI components
├── pages         # Next.js pages
├── public        # Static assets
├── styles        # Tailwind CSS styles
├── utils         # Utility functions
├── server        # Node.js server code
├── .env.local    # Environment variables
├── README.md     # Project documentation
├── package.json  # Project dependencies and scripts
└── tsconfig.json # TypeScript configuration
```

### Contributing 🤝

Contributions are welcome! Please fork the repository and create a pull request.

### License 📄

This project is licensed under the MIT License.

### Acknowledgements 🙌

- Next.js
- Tailwind CSS
- Shadcn
- GetStream
- Clerk
- Node.js
- Vercel
