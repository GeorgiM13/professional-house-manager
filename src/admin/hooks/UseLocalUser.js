import { useState, useEffect } from "react";

export function useLocalUser() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setUserId(parsedUser.id);
      }
    } catch (error) {
      console.error("Грешка при четене на user от localStorage:", error);
    }
  }, []);

  return { user, userId };
}