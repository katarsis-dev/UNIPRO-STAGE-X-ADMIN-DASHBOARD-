
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://fobgtpckfrzotpzjghhi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmd0cGNrZnJ6b3RwempnaGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDc3NDUsImV4cCI6MjA2OTg4Mzc0NX0.kSG6A5qLmAdxNt123az58Yf-jRIa2BSmn296G1mSK04";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);




document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";
    loginError.style.display = "none"; 

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        alert("Login Berhasil!");
        window.location.href = "dashboard.html"; 
      }
    } catch (error) {
      console.error("Login error:", error.message);
      loginError.textContent = "Login Gagal: " + error.message;
      loginError.style.display = "block";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Log in";
    }
  });
});
