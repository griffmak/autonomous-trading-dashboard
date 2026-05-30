import Navbar from '@/components/Navbar'
import { PositionsTable } from '@/components/PositionsTable'

export default function PositionsPage() {
  return (
    <>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Open Positions</h1>
        <div className="bg-trading-slate rounded p-6">
          <PositionsTable />
        </div>
      </main>
    </>
  )
}
