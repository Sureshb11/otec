import { useEffect, useState } from 'react';

const ThemeToggler = () => {
    const [colorMode, setColorMode] = useState(
        localStorage.getItem('color-theme') || 'light'
    );

    useEffect(() => {
        const className = 'dark';
        const element = window.document.documentElement;

        if (colorMode === 'dark') {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }

        localStorage.setItem('color-theme', colorMode);
    }, [colorMode]);

    return (
        <label
            className={`relative m-0 block h-7.5 w-14 rounded-full ${colorMode === 'dark' ? 'bg-primary' : 'bg-stroke dark:bg-strokedark'
                }`}
        >
            <input
                type="checkbox"
                onChange={() =>
                    setColorMode(colorMode === 'light' ? 'dark' : 'light')
                }
                className="dur absolute top-0 z-50 m-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
                className={`absolute top-1/2 left-[3px] flex h-6 w-6 -translate-y-1/2 translate-x-0 items-center justify-center rounded-full bg-white shadow-switcher duration-75 ease-linear ${colorMode === 'dark' && '!right-[3px] !translate-x-full'
                    }`}
            >
                <span className="dark:hidden">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="8" cy="8" r="3.2" fill="#EAB308" />
                        <path
                            d="M8 15.2C7.55817 15.2 7.2 14.8418 7.2 14.4V12.8C7.2 12.3582 7.55817 12 8 12C8.44183 12 8.8 12.3582 8.8 12.8V14.4C8.8 14.8418 8.44183 15.2 8 15.2Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M8 4C7.55817 4 7.2 3.64183 7.2 3.2V1.6C7.2 1.15817 7.55817 0.8 8 0.8C8.44183 0.8 8.8 1.15817 8.8 1.6V3.2C8.8 3.64183 8.44183 4 8 4Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M12.8 12.0001C12.5891 12.0001 12.3887 11.9126 12.246 11.7587C11.9431 11.4326 11.9599 10.9208 12.286 10.6179C12.5936 10.3323 12.9157 10.0381 13.2505 9.73489C13.5786 9.43773 14.085 9.46323 14.3821 9.79133C14.6793 10.1194 14.6538 10.6258 14.3257 10.9229C13.9749 11.2407 13.6375 11.5492 13.3155 11.8482C13.1705 11.9828 12.9804 12.0461 12.8 12.0001Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M10.6175 5.31422C10.3152 4.98762 10.3328 4.47587 10.6594 4.17351L11.7908 3.12628C12.1174 2.82392 12.6291 2.84151 12.9315 3.16811C13.2339 3.4947 13.2163 4.00645 12.8897 4.30881L11.7583 5.35605C11.6146 5.48906 11.4243 5.55227 11.2443 5.50604C11.0189 5.55594 10.7819 5.49183 10.6175 5.31422Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M5.13264 10.686C5.45924 10.9883 5.47683 11.5001 5.17447 11.8267L4.04301 12.8739C3.71642 13.1763 3.20466 13.1587 2.9023 12.8321C2.59994 12.5055 2.61753 11.9937 2.94413 11.6913L4.07559 10.6441C4.38652 10.3562 4.86981 10.4021 5.13264 10.686Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M3.25039 6.26511C3.57849 6.59171 3.553 7.09813 3.22639 7.42623C2.87563 7.74395 2.53818 8.05252 2.21624 8.3515C1.88814 8.64866 1.38173 8.62316 1.08457 8.29506C0.787409 7.96696 0.812906 7.46054 1.14101 7.16339C1.49177 6.84566 1.82921 6.5371 2.15116 6.23812C2.45524 5.96167 2.92484 5.9388 3.25039 6.26511Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M15.2 8C15.2 7.55817 14.8422 7.2 14.4 7.2H12.8C12.3586 7.2 12 7.55817 12 8C12 8.44183 12.3586 8.8 12.8 8.8H14.4C14.8422 8.8 15.2 8.44183 15.2 8Z"
                            fill="#EAB308"
                        />
                        <path
                            d="M3.2 2C2.75856 2 2.4 2.35817 2.4 2.8C2.4 3.24183 2.75856 3.6 3.2 3.6H4C4.44222 3.6 4.8 3.24183 4.8 2.8C4.8 2.35817 4.44222 2 4 2H3.2Z"
                            fill="#EAB308"
                        />
                    </svg>
                </span>
                <span className="hidden dark:inline-block">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M21.752 15.002A9.718 9.718 0 0118 16c-5.523 0-10-4.477-10-10 0-1.9.55-3.665 1.496-5.163-5.266.97-9.247 5.753-8.98 11.235C1.042 17.585 5.597 21.907 10.975 21.996c5.789.096 10.518-4.47 10.777-10.158V15.002z"
                            fill="#3B82F6"
                        />
                    </svg>
                </span>
            </span>
        </label>
    );
};

export default ThemeToggler;
