export default function Table({ children }: any) {
    return (
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full">{children}</table>
      </div>
    );
  }
  