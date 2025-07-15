import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Onboarding } from '../../components/onboarding'

vi.mock('next-auth/react')
vi.mock('next/navigation')

describe('Onboarding Component', () => {
  const mockPush = vi.fn()
  const mockUseRouter = useRouter as ReturnType<typeof vi.fn>
  const mockUseSession = useSession as ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUseRouter.mockReturnValue({ push: mockPush })
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    vi.clearAllMocks()
  })

  it('renders the first step (role selection)', () => {
    render(<Onboarding />)
    
    expect(screen.getByText('MAS AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('What best describes your role?')).toBeInTheDocument()
    expect(screen.getByText('MAS Client')).toBeInTheDocument()
    expect(screen.getByText('MAS Staff / Volunteer Consultant')).toBeInTheDocument()
  })

  it('allows role selection and progression', async () => {
    render(<Onboarding />)
    
    // Select MAS Client role
    fireEvent.click(screen.getByText('MAS Client'))
    
    // Next button should be enabled
    const nextButton = screen.getByText('Next')
    expect(nextButton).not.toBeDisabled()
    
    // Click next to go to step 2
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('What topic are you interested in?')).toBeInTheDocument()
    })
  })

  it('shows custom role input when "Other" is selected', () => {
    render(<Onboarding />)
    
    fireEvent.click(screen.getByText('Other (please specify)'))
    
    expect(screen.getByPlaceholderText(/Board member at a health charity/)).toBeInTheDocument()
  })

  it('shows appropriate topics for MAS Staff/VC role', async () => {
    render(<Onboarding />)
    
    // Select MAS Staff/VC role
    fireEvent.click(screen.getByText('MAS Staff / Volunteer Consultant'))
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      expect(screen.getByText('Using CiviCRM')).toBeInTheDocument()
      expect(screen.getByText('Implementing CiviCRM')).toBeInTheDocument()
    })
  })

  it('shows Microsoft login option for MAS Staff/VC', async () => {
    render(<Onboarding />)
    
    // Go through role and topic selection
    fireEvent.click(screen.getByText('MAS Staff / Volunteer Consultant'))
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('AI'))
      fireEvent.click(screen.getByText('Next'))
    })
    
    await waitFor(() => {
      expect(screen.getByText('Log in (Microsoft)')).toBeInTheDocument()
      expect(screen.getByText('Required for VC Templates & project history')).toBeInTheDocument()
    })
  })

  it('saves user profile to localStorage on completion', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(<Onboarding />)
    
    // Complete onboarding flow
    fireEvent.click(screen.getByText('MAS Client'))
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Fundraising'))
      fireEvent.click(screen.getByText('Next'))
    })
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Continue anonymously'))
      fireEvent.click(screen.getByText('Start Conversation'))
    })
    
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('userProfile', expect.stringContaining('mas-client'))
    })
  })

  it('handles authenticated Microsoft session', () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com', name: 'Test User' } },
      status: 'authenticated'
    })
    
    render(<Onboarding />)
    
    // Go to authentication step
    fireEvent.click(screen.getByText('MAS Staff / Volunteer Consultant'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('AI'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Log in (Microsoft)'))
    
    expect(screen.getByText('✓ Signed in as test@example.com')).toBeInTheDocument()
  })
})