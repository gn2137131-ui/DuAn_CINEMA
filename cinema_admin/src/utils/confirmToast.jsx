import toast from 'react-hot-toast';

export const confirmToast = (message, onConfirm) => {
    toast((t) => (
        <div className="flex flex-col gap-3">
            <p className="font-semibold text-gray-800">{message}</p>
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Hủy
                </button>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        onConfirm();
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Xác nhận
                </button>
            </div>
        </div>
    ), {
        duration: Infinity,
        position: 'top-center',
    });
};
