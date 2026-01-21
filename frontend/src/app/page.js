'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  const fadeLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut', delay },
    }),
  }

  const fadeRight = {
    hidden: { opacity: 0, x: 40 },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut', delay },
    }),
  }

  return (
    <main className="bg-white min-h-screen">
      {/* Navbar */}
      <div className="h-20 top-0 z-50 sticky flex justify-between items-center md:px-20 px-8 border-b-2 border-gray-300 bg-white">
        <div className="text-xl flex gap-2 items-center">
          <div className="bg-blue-600 px-3 py-1 rounded-lg font-bold text-white">
            A
          </div>
          <div className="text-black font-serif">AIMS Portal</div>
        </div>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative  md:pb-10 pb-20 md:px-20 px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 ">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.h1
              custom={0.2}
              variants={fadeLeft}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-6xl lg:text-7xl font-bold"
            >
              Empower Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Journey
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              custom={0.3}
              variants={fadeLeft}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-gray-600"
            >
              Streamline student management, grades, attendance, and
              communication in one unified platform.
            </motion.p>
            {/* <motion.div
              custom={0.5}
              variants={fadeLeft}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-4 pt-8"
            >
              {[
                { value: '500+', label: 'Institutions' },
                { value: '50K+', label: 'Active Users' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-blue-600">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </motion.div> */}
          </div>
          <motion.div
            custom={0.3}
            variants={fadeRight}
            initial="hidden"
            animate="visible"
            className="relative md:pt-10"
          >
            <div className="relative w-full aspect-square rounded-3xl border bg-gradient-to-br from-blue-200 to-purple-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="space-y-6 text-center">
                  <div className="flex justify-center gap-4">
                    <motion.div
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-24 h-24 bg-blue-600 rounded-2xl"
                    />
                    <motion.div
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
                      className="w-24 h-24 bg-purple-600 rounded-2xl"
                    />
                  </div>

                  <p className="text-gray-600 font-semibold">
                    Comprehensive Dashboard
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
