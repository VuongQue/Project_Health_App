export default function Button({ children, ...props }: any) {
    return (
      <button
        {...props}
        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        {children}
      </button>
    );
  }
  