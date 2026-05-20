import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/shared/Layout'
import SelectRole from './pages/SelectRole'
import EmployeePage from './pages/EmployeePage'
import TaxiPage from './pages/TaxiPage'
import DispatchPage from './pages/DispatchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SelectRole />} />
        <Route path="employee" element={<EmployeePage />} />
        <Route path="taxi" element={<TaxiPage />} />
        <Route path="dispatch" element={<DispatchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
