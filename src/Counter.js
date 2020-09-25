/** @jsx Didact.createElement */
import Didact from './Didact'

function Counter () {
  const [state, setState] = Didact.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      {state}
    </h1>
  )
}

export default Counter
