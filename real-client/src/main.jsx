import { RouterProvider } from "react-router";
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from "./app/router.jsx";
import { store } from "./app/store.js";
import { Provider } from 'react-redux'
import ThemeProvider from './shared/theme/ThemeProvider.jsx'

createRoot(document.getElementById('root')).render(

    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router}/>
      </ThemeProvider>
    </Provider>
)
