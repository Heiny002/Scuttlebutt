"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-3 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
      <Link href="/privacy" className="hover:underline">
        Privacy Policy
      </Link>
      <span className="mx-2">|</span>
      <Link href="/terms" className="hover:underline">
        Terms & Conditions
      </Link>
    </footer>
  );
}
