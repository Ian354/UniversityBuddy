"use client";
import React from "react";
import Link from "next/link";
import Navigation from "@/app/components/Navigation";
import UniInfo from "@/app/components/UniInfo";
import { useParams } from "next/navigation";

export default function UniversityPage() {
    const { id } = useParams() as { id: string | undefined };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <Navigation />
            <UniInfo id={id ?? ""} />
        </div>
    );
}
