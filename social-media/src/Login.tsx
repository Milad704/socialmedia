import React, { useState, FormEvent, ChangeEvent } from "react";

// Define the prop types explicitly
interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");

  // Properly typed event handler for form submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username.trim() !== "") {
      onLogin(username);
    }
  };

  // Properly typed event handler for input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <main className="login-screen">
      <h1>Welcome to SnapClone 📸</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your username..."
          value={username}
          onChange={handleChange}
        />
        <button type="submit">Log In</button>
      </form>
    </main>
  );
}
