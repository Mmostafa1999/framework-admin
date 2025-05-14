import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h2 className="text-3xl font-bold mb-4">Not Found</h2>
            <p className="mb-6">Could not find the requested resource</p>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Return Home
            </Link>
        </div>
    )
} 