"use client"

import { useEffect } from "react";
import LoginPage from "./login/page"
import { useRouter } from "next/navigation";
import checkLocalStorage from "./utils/utils";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const jwt = checkLocalStorage("jwt");

    if(jwt) {
      router.push("/dashboard/main");
    } else {
      router.push("/login");
    }
  }, [router])
}
