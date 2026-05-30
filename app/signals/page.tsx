import Navbar from '@/components/Navbar'
import { SignalsTable } from '@/components/SignalsTable'

export default function SignalsPage() {
  return (
    <>
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Signals</h1>
        <div className="bg-trading-slate rounded p-6">
          <SignalsTable />
        </div>
      </main>
    </>
  )
}
