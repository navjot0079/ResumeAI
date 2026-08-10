import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/validators'
import { User, Mail, Calendar, Shield } from 'lucide-react'

function Profile() {
  const { user } = useAuth()

  const profileFields = [
    {
      label: 'Full Name',
      value: user?.name,
      icon: User,
    },
    {
      label: 'Email Address',
      value: user?.email,
      icon: Mail,
    },
    {
      label: 'Member Since',
      value: user?.createdAt ? formatDate(user.createdAt) : 'N/A',
      icon: Calendar,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-500 mb-8">Your account information</p>

        {/* Avatar */}
        <div className="card mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Account Details</h3>
          <div className="space-y-5">
            {profileFields.map((field, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                  <field.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {field.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {field.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Profile
