import { useEffect } from "react";
import { useLocation } from "wouter";

export default function MasterclassOptIn() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/fb-ads-course", { replace: true });
  }, [navigate]);

  return null;
}
