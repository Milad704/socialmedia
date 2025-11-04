// Importing React hooks and Firestore functions
import React, { useState, useEffect, FormEvent } from "react";
import {
  doc,        // create a reference (pointer) to a specific document in Firestore
  getDoc,     // read one document from Firestore
  setDoc,     // create or overwrite a document
  updateDoc,  // update certain fields in an existing document
  getDocs,    // read multiple documents from a collection
  collection, // create a reference to a collection (like "users")
} from "firebase/firestore";
import { db } from "./firebase"; // your initialized Firestore instance

// The props this component accepts (from its parent)
interface LoginProps {
  onLogin: (username: string, id: number) => void;
  // onLogin is a function the parent passes in
  // we call it when login or signup succeeds
}

export default function Login({ onLogin }: LoginProps) {
  // --- STATE (form + UI) ---
  const [username, setUsername] = useState(""); // stores typed username
  const [password, setPassword] = useState(""); // stores typed password
  const [isSignup, setIsSignup] = useState(false); // true=signup view, false=login view

  // --- HELPER: Generate a unique random ID for new users ---
  const generateId = async () => {
    const used: number[] = [];
    const userdocs = await getDocs(collection(db, "users"));
    userdocs.forEach((doc) => {
      const dataid = doc.data();
      if (dataid.id != null) {
        used.push(dataid.id);
      }
    })
    let id;
    do {
      let alreadyused = false;
      id = Math.floor(100_000 + Math.random() * 900_000);
      for (let i = 0; i < used.length; i++) {
        if (used[i] === id) {
          alreadyused = true;
          break
        }
      }
      if (alreadyused === false) {
        break
      }
    } while (true)
    return id
  }

  // --- FORM SUBMISSION HANDLER (login or signup) ---
  const handleSubmit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    const name = username.trim();
    const pass = password.trim();
    if (name === ("") || pass === ("")) {
      alert("Username and password cannot be empty");
      return;
    }
    // this 3 lines of code is to see if this name chosen is already in database
    const userdoc_ref = doc(db, "users", name); // make a reference to this document

    const userdoc = await getDoc(userdoc_ref); // grab document if it exists, couldnt before referencing it

    const userdata = userdoc.data(); // get the actual data inside

    if (isSignup === true) {
      if (userdoc.exists() === true) {
        alert("this user name is already taken")
        return;
      }
      const id = await generateId();
      await setDoc(userdoc_ref, { // setdoc creates doc, must be a reference inside bracket to be crea
        id: id,
        password: pass,
        createdAt: new Date(),
      });
      onLogin(name, id); // tell parent login/signup was successful
    } else {
      if (userdoc.exists() === false) {
        alert("this username does not exist")
        return;
      }
      if (userdata?.password !== pass) { // ? is incase userdata is not defined, causes error.
        alert("Incorrect password")
        return
      }
      onLogin(name, userdata.id);
    }
  }

  const handleChangePassword = async () => {
    const name = username.trim();
    if (name === ("")) {
      alert("Enter your username first");
      return;
    }
    const userdoc_ref = doc(db, "users", name);

    const userdoc= await getDoc(userdoc_ref);

    const userdata = userdoc.data();

    if (userdoc.exists() === false) {
      alert("Incorrect username, please use correct username");
      return;
    }
    const ask_currentpass = prompt("Input your current password");
    if (userdata?.password !== ask_currentpass) {
      alert("incorrect password");
      return;
    }
    const make_newpass = prompt("Input the new password you want");
    await updateDoc(userdoc_ref, { password: make_newpass?.trim() })
  };

  // --- UI RENDER ---
  return (
    <main className="login-screen">
      <h1>
        Welcome to SnapClone 📸
        <br />
        <span style={{ fontSize: 14, color: "#888" }}>
        </span>
      </h1>

      {/* Buttons to toggle between Login and Signup */}
      <div className="toggle-buttons">
        {/* Login button */}
        <button
          onClick={() => setIsSignup(false)}>
          log in
        </button>
        <button
          onClick={() => setIsSignup(true)}>
          Sign Up
        </button>
      </div>

      {/* The login/signup form */}
      <form onSubmit={handleSubmit}>
        {/*showing input and button if user is signing up */}
        {isSignup && (
          <input
            type="text"
            placeholder="Choose a username"
            onChange={(type_event) => setUsername(type_event.target.value)}
          ></input>
        )}
        {isSignup && (
          <input
            type="password"
            placeholder="Choose a password"
            onChange={(type_event) => setPassword(type_event.target.value)}
          ></input>
        )}
        {isSignup && (
          <button type="submit">
            create a account
          </button>
        )}
        {/* input and button if user is logging in */}
        {!isSignup && (
          <input type="text" placeholder="type your username"
            onChange={(type_event) => setUsername(type_event.target.value)}>
          </input>
        )}
        {!isSignup && (
          <input type="password" placeholder="type your password"
            onChange={(type_event) => setPassword(type_event.target.value)}>
            </input>
        )}
        {!isSignup && (
          <button type="submit">
            log in
          </button>
        )}
      </form>

      {/* Show password change option ONLY if logging in */}
      {!isSignup && (
        <button
          onClick={handleChangePassword}
          style={{ marginTop: 10, backgroundColor: "#eee" }}
        >
          🔑 Change Password
        </button>
      )}

      {/* Little note under form */}
      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
