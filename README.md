# Dice Probability Calculator

A web application for calculating dice roll probabilities and tracking dice sets.

## Features

- User authentication (sign up, sign in, password reset)
- Create and manage dice sets
- Track dice rolls
- Calculate probabilities based on roll history

## Technologies Used

- [Next.js](https://nextjs.org) - React framework for building the frontend and API routes
- [Supabase](https://supabase.com) - Backend as a Service for authentication and database
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework for styling
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- A Supabase account and project

### Installation

1. Clone the repository: `git clone https://github.com/your-username/dice-probability-calculator.git
cd dice-probability-calculator  `

2. Install dependencies: `npm install  `

3. Set up environment variables:
   Rename `.env.example` to `.env.local` and update the following: `NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]  `

4. Run the development server: `npm run dev  `

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This project can be easily deployed to Vercel. For other hosting options, please refer to the Next.js deployment documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
