export default function invariant(condition, message) {
  if (condition) {
    return
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[rocketjump-core] RocketJump error occured ' +
        'use the non-minified dev environment for the full error message.'
    )
  } else {
    throw new Error(`[rocketjump-core] ${message}`)
  }
}
