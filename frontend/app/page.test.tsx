import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from './page'

// Mock the Navigation component
jest.mock('./components/Navigation', () => {
  return function MockNavigation() {
    return <div data-testid="mock-navigation">Navigation</div>
  }
})

describe('Home Page', () => {
  it('should render the main heading', () => {
    render(<Home />)

    expect(screen.getByText('Bienvenido a la plataforma universitaria')).toBeInTheDocument()
  })

  it('should render the description text', () => {
    render(<Home />)

    expect(screen.getByText(/Encuentra información relevante sobre universidades/)).toBeInTheDocument()
  })

  it('should render the Navigation component', () => {
    render(<Home />)

    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument()
  })

  it('should render university search link', () => {
    render(<Home />)

    expect(screen.getByText('Buscador de universidad')).toBeInTheDocument()
    expect(screen.getByText(/Filtra y busca universidades/)).toBeInTheDocument()
  })

  it('should render mentorships link', () => {
    render(<Home />)

    expect(screen.getByText('Mentorías')).toBeInTheDocument()
    expect(screen.getByText(/Accede a actividades, foros y busca mentores/)).toBeInTheDocument()
  })

  it('should render relevant contacts link', () => {
    render(<Home />)

    expect(screen.getByText('Contactos relevantes')).toBeInTheDocument()
    expect(screen.getByText(/Encuentra estudiantes con intereses similares/)).toBeInTheDocument()
  })

  it('should have correct link href for university search', () => {
    render(<Home />)

    const universityLink = screen.getByText('Buscador de universidad').closest('a')
    expect(universityLink).toHaveAttribute('href', '/university')
  })
})