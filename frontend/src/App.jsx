import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/shared/Layout'
import ProtectedRoute from './components/shared/ProtectedRoute'
import SelectRole from './pages/SelectRole'
import EmployeePage from './pages/EmployeePage'
import TaxiPage from './pages/TaxiPage'
import DispatchPage from './pages/DispatchPage'
import { AppRoles } from './auth/msalConfig'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<SelectRole />} />

        <Route path="employee" element={
          <ProtectedRoute roles={[AppRoles.Mitarbeiter, AppRoles.Admin]}>
            <EmployeePage />
          </ProtectedRoute>
        } />

        <Route path="taxi" element={
          <ProtectedRoute roles={[AppRoles.Taxifahrer, AppRoles.Admin]}>
            <TaxiPage />
          </ProtectedRoute>
        } />

        <Route path="dispatch" element={
          <ProtectedRoute roles={[AppRoles.Disposition, AppRoles.Admin]}>
            <DispatchPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
