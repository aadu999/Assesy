import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px] animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        A
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h1>
                    <p className="text-slate-400 text-sm">{subtitle}</p>
                </div>
                {children}
            </motion.div>
        </div>
    );
};

export default AuthLayout;
