import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).idToken = token.idToken as string
      return session
    },
    async redirect({ url, baseUrl }) {
      // If there's a callbackUrl in the query params, use it
      const urlObj = new URL(url, baseUrl)
      const callbackUrl = urlObj.searchParams.get('callbackUrl')
      
      if (callbackUrl) {
        return callbackUrl
      }
      
      // Otherwise, redirect to home
      return baseUrl
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }