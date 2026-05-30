import Navbar from '@/components/Navbar'
import { HistoryTable } from '@/components/HistoryTable'

export default function HistoryPage() {
  return (
    <>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Trade History</h1>
        <div className="bg-trading-slate rounded p-6">
          <HistoryTable />
        </div>
      </main>
    </>
  )
}
