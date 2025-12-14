const Button = ({
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} ${loading ? "loading" : ""} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}   // safe because fullWidth was removed
    >
      {loading ? "⏳" : children}
    </button>
  );
};

export default Button;
