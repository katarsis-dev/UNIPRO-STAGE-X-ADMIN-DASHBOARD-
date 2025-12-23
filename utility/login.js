
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
