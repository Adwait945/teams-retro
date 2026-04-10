import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))

jest.mock('@/services/userService', () => ({
  registerUser: jest.fn(),
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  getAllUsers: jest.fn(),
}))

import RegistrationPage from '@/app/page'
import { registerUser, getCurrentUser, cacheUser } from '@/services/userService'

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
})

// REG-1 — renders 3 form fields
test('REG-1: renders page with 3 form fields', () => {
  render(<RegistrationPage />)
  expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/pod/i)).toBeInTheDocument()
})

// REG-2 — pod selector has exactly 3 options
test('REG-2: pod selector has exactly 3 options', () => {
  render(<RegistrationPage />)
  expect(screen.getByText('Pod 1')).toBeInTheDocument()
  expect(screen.getByText('Pod 2')).toBeInTheDocument()
  expect(screen.getByText('Pod 3')).toBeInTheDocument()
  const options = screen.getAllByRole('option').filter(
    (o) => ['pod1', 'pod2', 'pod3'].includes((o as HTMLOptionElement).value)
  )
  expect(options).toHaveLength(3)
})

// REG-3 — submit button disabled when any field is empty
test('REG-3: submit button disabled with 0, 1, and 2 fields filled', () => {
  render(<RegistrationPage />)
  const btn = screen.getByRole('button', { name: /join retroboard/i })
  expect(btn).toBeDisabled()

  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
  expect(btn).toBeDisabled()

  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
  expect(btn).toBeDisabled()
})

// REG-4 — submit button enabled when all 3 fields filled
test('REG-4: submit button enabled when all 3 fields filled', () => {
  render(<RegistrationPage />)
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
  fireEvent.change(screen.getByLabelText(/pod/i), { target: { value: 'pod1' } })
  expect(screen.getByRole('button', { name: /join retroboard/i })).not.toBeDisabled()
})

// REG-5 — submitting form calls registerUser with correct payload
test('REG-5: submitting form calls registerUser with { name, username, pod }', async () => {
  const mockUser = { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...' }
  ;(registerUser as jest.Mock).mockResolvedValue(mockUser)

  render(<RegistrationPage />)
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
  fireEvent.change(screen.getByLabelText(/pod/i), { target: { value: 'pod1' } })
  fireEvent.click(screen.getByRole('button', { name: /join retroboard/i }))

  await waitFor(() => {
    expect(registerUser).toHaveBeenCalledWith({ name: 'Alice', username: 'alice', pod: 'pod1' })
    expect(registerUser).toHaveBeenCalledTimes(1)
  })
})

// REG-6 — cacheUser called with returned user
test('REG-6: cacheUser is called with the returned user after registration', async () => {
  const mockUser = { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...' }
  ;(registerUser as jest.Mock).mockResolvedValue(mockUser)

  render(<RegistrationPage />)
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
  fireEvent.change(screen.getByLabelText(/pod/i), { target: { value: 'pod1' } })
  fireEvent.click(screen.getByRole('button', { name: /join retroboard/i }))

  await waitFor(() => {
    expect(cacheUser).toHaveBeenCalledWith(mockUser)
    expect(cacheUser).toHaveBeenCalledTimes(1)
  })
})

// REG-7 — router.push('/dashboard') called after success
test('REG-7: router.push("/dashboard") called after successful registration', async () => {
  const mockUser = { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...' }
  ;(registerUser as jest.Mock).mockResolvedValue(mockUser)

  render(<RegistrationPage />)
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
  fireEvent.change(screen.getByLabelText(/pod/i), { target: { value: 'pod1' } })
  fireEvent.click(screen.getByRole('button', { name: /join retroboard/i }))

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })
})

// REG-8 — if existing user in session, redirect to /dashboard on mount
test('REG-8: redirects to /dashboard on mount if user already cached', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue({
    _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...'
  })

  render(<RegistrationPage />)

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
  expect(registerUser).not.toHaveBeenCalled()
})
