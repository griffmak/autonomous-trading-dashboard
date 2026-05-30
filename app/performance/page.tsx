import Navbar from '@/components/Navbar'
import { PerfChart } from '@/components/PerfChart'

export default function PerformancePage() {
  return (
    <>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Performance</h1>
        <PerfChart />
      </main>
    </>
  )
}
