'use client'

import { useEffect, useState } from "react";
import Navigation from "./components/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (!token || !user) {
          router.push('/university');
      }
  }, []);

  return (
    <main className="min-h-screen bg-gray-900">
      <Navigation />
      <section className="max-w-2xl mx-auto mt-12 space-y-8 text-center">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Welcome to UniversityBuddy</h1>
        <p className="text-gray-400 mb-6">
          Find relevant information about universities, Erasmus mobility, mentoring, and student contacts.
        </p>
        <div className="grid gap-4">
          <Link href="/university" className="block bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg border border-gray-700 hover:border-gray-500 transition">
            <span className="font-semibold text-lg text-gray-200">University Search</span>
            <p className="text-gray-400 mt-2">Filter and search universities in Spain according to your interests.</p>
          </Link>
          <a href="/mentor" className="block bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg border border-gray-700 hover:border-gray-500 transition">
            <span className="font-semibold text-lg text-gray-200">Mentoring</span>
            <p className="text-gray-400 mt-2">Access activities, forums, and find mentors.</p>
          </a>
          <a href="/erasmus-help" className="block bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg border border-gray-700 hover:border-gray-500 transition">
            <span className="font-semibold text-lg text-gray-200">Erasmus Help</span>
            <p className="text-gray-400 mt-2">Connect with students going to the same Erasmus university or from your city/country.</p>
          </a>
        </div>
      </section>
    </main>
  );
}