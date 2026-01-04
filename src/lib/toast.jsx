import { toast } from "react-toastify";

const baseStyle = {
  background: "#fff",
  color: "#1f2937",
  borderLeft: "6px solid #EA6031"
};

export const showSuccess = (message) =>
  toast.success(message, {
    style: baseStyle
  });

export const showInfo = (message) =>
  toast.info(message, {
    style: baseStyle
  });

export const showWarning = (message) =>
  toast.warning(message, {
    style: {
      ...baseStyle,
      borderLeft: "6px solid #f59e0b"
    }
  });

export const showError = (message) =>
  toast.error(message, {
    style: {
      ...baseStyle,
      borderLeft: "6px solid #dc2626"
    }
  });

 export const confirmToast = (message, onConfirm) => {
  toast(
    ({ closeToast }) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-800">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeToast}
            className="px-3 py-1 text-sm border rounded-md"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm();
              closeToast();
            }}
            className="px-3 py-1 text-sm rounded-md text-white"
            style={{ backgroundColor: "#EA6031" }}
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      style: {
        background: "#fff",
        borderLeft: "6px solid #EA6031",
      },
    }
  );
};