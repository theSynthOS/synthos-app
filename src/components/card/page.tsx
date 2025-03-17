import React from 'react'

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div>
      <div className={`rounded-sm px-3 py-2 w-fit ${className || ''}`}>
        {children}
      </div>
    </div>
  )
}

export default Card
