import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">AIMS Portal</h1>
        <p className="text-center mb-8">Academic Information Management System</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
