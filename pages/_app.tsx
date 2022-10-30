import "../styles/globals.css";
import type { AppProps } from "next/app";
import awsConfig from "../src/aws-exports";
import { Amplify, Hub } from "aws-amplify";
import { Auth, CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
export async function getServerSideProps() {
  const isLocalhost = process.env.NODE_ENV === "development";

  // Assuming you have two redirect URIs, and the first is for localhost and second is for production
  const [localRedirectSignIn, mainRedirectSignIn] =
    awsConfig.oauth.redirectSignIn.split(",");

  const [localRedirectSignOut, mainRedirectSignOut] =
    awsConfig.oauth.redirectSignOut.split(",");

  const updatedAwsConfig = {
    ...awsConfig,
    oauth: {
      ...awsConfig.oauth,
      redirectSignIn: isLocalhost ? localRedirectSignIn : mainRedirectSignIn,
      redirectSignOut: isLocalhost ? localRedirectSignOut : mainRedirectSignOut,
    },
  };

  Amplify.configure(updatedAwsConfig);
}

function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState(null);
  const [customState, setCustomState] = useState(null);

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
          setUser(data);
          break;
        case "signOut":
          setUser(null);
          break;
        case "customOAuthState":
          setCustomState(data);
      }
    });

    Auth.currentAuthenticatedUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => console.log("Not signed in"));

    return unsubscribe;
  }, []);

  return (
    <>
      {user ? (
        <Component {...pageProps} user={user} />
      ) : (
        <SignInButton />
      )}
      ;
    </>
  );
}

export const SignInButton = () => {
  return <button
    onClick={() =>
      Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google })
    }
  >
    Sign In With Google
  </button>;
};
export default MyApp;
