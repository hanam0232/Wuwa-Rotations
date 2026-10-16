import { useEffect, useState } from "react";
import "./AlertModal.css";

export default function AlertModal({
    type = "alert",
    title,
    message,
    inputDefaultValue = "",
    confirmText = "OK",
    cancelText = "Hủy",
    onConfirm,
    onClose,
}) {
    const [inputValue, setInputValue] = useState(inputDefaultValue);

    useEffect(() => {
        if (!onClose) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleConfirm = (event) => {
        event.preventDefault();
        const value = type === "prompt" ? inputValue : undefined;
        onClose();
        onConfirm?.(value);
    };

    return (
        <div className="alert-modal-backdrop">
            <section
                className="alert-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="alert-modal-title"
                aria-describedby="alert-modal-message"
            >
                <h2 id="alert-modal-title">{title}</h2>
                <p id="alert-modal-message">{message}</p>

                <form onSubmit={handleConfirm}>
                    {type === "prompt" && (
                        <input
                            className="alert-modal-input"
                            autoFocus
                            value={inputValue}
                            onChange={(event) =>
                                setInputValue(event.target.value)
                            }
                            aria-label="Tên preset"
                        />
                    )}
                    <div className="alert-modal-actions">
                        {type !== "alert" && (
                            <button
                                type="button"
                                className="alert-modal-button secondary"
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            type="submit"
                            className="alert-modal-button primary"
                            disabled={
                                type === "prompt" && !inputValue.trim()
                            }
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
