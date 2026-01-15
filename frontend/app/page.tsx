"use client";

import { Navbar } from "@/components/Navbar";
import { RaffleList } from "@/components/RaffleList";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              GenLayer Raffle System
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered raffle selection on GenLayer blockchain.
              <br />
              Create raffles, enter with your reasons, and let AI choose the winners.
            </p>
          </div>

          <div className="animate-slide-up">
            <RaffleList />
          </div>

          <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">1. Create a Raffle</div>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet and create a raffle with your theme. Set the number of winners and end date.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">2. Participants Enter</div>
                <p className="text-sm text-muted-foreground">
                  Participants enter with a unique username and explain why they deserve to win. Reasons are hidden until resolution.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">3. AI Selects Winners</div>
                <p className="text-sm text-muted-foreground">
                  The creator triggers AI selection. GenLayer AI matches participant reasons with the raffle theme to choose winners fairly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Powered by GenLayer
            </a>
            <a href="https://studio.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Studio
            </a>
            <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Docs
            </a>
            <a href="https://github.com/genlayerlabs/genlayer-project-boilerplate" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
