import axios from "axios";

const BACKEND_API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function login(username: string): Promise<string> {
    try {
      const endpoint = `${BACKEND_API}/login?username=${encodeURIComponent(username)}`;
      await axios.post(endpoint);
      return username;
    } catch (error) {}
    return '';
}
