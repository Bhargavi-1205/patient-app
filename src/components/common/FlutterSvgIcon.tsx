import React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import HospitalIcon from '../../../assets/Icons/Hospital.svg';
import StethoscopeIcon from '../../../assets/Icons/stethoscope.svg';
import MedicalPrescriptionIcon from '../../../assets/Icons/Medical Prescription.svg';
import TermAndPolicyIcon from '../../../assets/Icons/Term And Policy.svg';
import DegreeIcon from '../../../assets/Icons/Degree.svg';
import RoomIcon from '../../../assets/Icons/Room.svg';
import MedicineIcon from '../../../assets/Icons/medicine.svg';
import InjectionIcon from '../../../assets/Icons/Injection.svg';
import VerifiedIcon from '../../../assets/Icons/Verified.svg';
import FalseIcon from '../../../assets/Icons/False.svg';
import DoctorMaleIcon from '../../../assets/Icons/Doctor Male.svg';
import CalendarIcon from '../../../assets/Icons/Calender.svg';
import ReportsIcon from '../../../assets/Icons/Reports.svg';
import MedicalIcon from '../../../assets/Icons/Medical.svg';
import SearchIcon from '../../../assets/Icons/Search.svg';
import FilterIcon from '../../../assets/Icons/filter.svg';
import BackwardIcon from '../../../assets/Icons/backward.svg';
import ForwardIcon from '../../../assets/Icons/forward.svg';
import UserIcon from '../../../assets/Icons/user.svg';
import HomeIcon from '../../../assets/Icons/Home.svg';
import StarIcon from '../../../assets/Icons/Star.svg';
import EditIcon from '../../../assets/Icons/Edit.svg';
import AddIcon from '../../../assets/Icons/add.svg';
import TimeIcon from '../../../assets/Icons/Time.svg';
import LogoutIcon from '../../../assets/Icons/log-out.svg';
import LockIcon from '../../../assets/Icons/lock.svg';
import MoreIcon from '../../../assets/Icons/More.svg';
import KebabIcon from '../../../assets/Icons/Kebab.svg';
import ChatIcon from '../../../assets/Icons/Chat.svg';
import DownloadIcon from '../../../assets/Icons/Download.svg';

export type FlutterSvgIconName =
    | 'bell'
    | 'tabHome'
    | 'tabFeed'
    | 'hospital'
    | 'stethoscope'
    | 'medicalPrescription'
    | 'termAndPolicy'
    | 'degree'
    | 'room'
    | 'medicine'
    | 'injection'
    | 'verified'
    | 'false'
    | 'doctorMale'
    | 'calendar'
    | 'reports'
    | 'medical'
    | 'search'
    | 'filter'
    | 'back'
    | 'forward'
    | 'user'
    | 'home'
    | 'star'
    | 'edit'
    | 'add'
    | 'time'
    | 'logout'
    | 'lock'
    | 'more'
    | 'menu'
    | 'chat'
    | 'download';

interface FlutterSvgIconProps extends Omit<SvgProps, 'width' | 'height'> {
    name: FlutterSvgIconName;
    size?: number;
    width?: number;
    height?: number;
    color?: string;
}

export default function FlutterSvgIcon({
    name,
    size = 24,
    width,
    height,
    color,
    ...props
}: FlutterSvgIconProps) {
    // Some SVGs use a non-square viewBox; allow explicit width/height overrides.
    const iconWidth = width ?? size;
    const iconHeight = height ?? size;
    const resolvedColor = typeof color === 'string' ? color : '#333333';

    if (name === 'bell') {
        return (
            <Svg
                width={iconWidth}
                height={iconHeight}
                viewBox="0 0 19 23"
                fill="none"
                {...props}>
                <Path
                    d="M0.56665 19.3169V17.0835H2.79999V9.26685C2.79999 7.72212 3.26527 6.3542 4.19582 5.16309C5.12638 3.95336 6.33611 3.16239 7.825 2.79017V2.0085C7.825 1.54322 7.98319 1.15239 8.29958 0.835996C8.63458 0.500996 9.03472 0.333496 9.5 0.333496C9.96528 0.333496 10.3561 0.500996 10.6725 0.835996C11.0075 1.15239 11.175 1.54322 11.175 2.0085V2.79017C12.6639 3.16239 13.8736 3.95336 14.8042 5.16309C15.7347 6.3542 16.2 7.72212 16.2 9.26685V17.0835H18.4333V19.3169H0.56665ZM9.5 22.6669C8.88583 22.6669 8.35542 22.4528 7.90875 22.0248C7.48069 21.5781 7.26666 21.0477 7.26666 20.4335H11.7333C11.7333 21.0477 11.51 21.5781 11.0633 22.0248C10.6353 22.4528 10.1142 22.6669 9.5 22.6669ZM5.03333 17.0835H13.9667V9.26685C13.9667 8.03851 13.5293 6.98698 12.6546 6.11226C11.7799 5.23753 10.7283 4.80017 9.5 4.80017C8.27167 4.80017 7.22014 5.23753 6.34541 6.11226C5.47069 6.98698 5.03333 8.03851 5.03333 9.26685V17.0835Z"
                    fill={resolvedColor}
                />
            </Svg>
        );
    }

    if (name === 'tabHome') {
        return (
            <Svg
                width={iconWidth}
                height={iconHeight}
                viewBox="0 0 28 28"
                fill="none"
                {...props}>
                <Path
                    d="M13.9997 2.21607C13.591 2.21607 13.1604 2.33977 12.819 2.68114L4.3757 10.5012L4.36318 10.5106C3.86522 11.0086 3.71803 11.7868 4.00302 12.3537C4.26296 12.8767 4.79849 13.1899 5.3904 13.2384L5.38727 13.2572V24.2185C5.38727 24.6256 5.53603 25.0453 5.83042 25.3396C6.12637 25.6356 6.54447 25.7844 6.95317 25.7844H11.6509C12.0596 25.7844 12.4776 25.6356 12.7736 25.3396C13.068 25.0453 13.2167 24.6272 13.2167 24.2185V19.6774C13.2167 19.7024 13.2277 19.6382 13.281 19.5834C13.3342 19.5317 13.3984 19.5208 13.3733 19.5208H14.6261C14.601 19.5208 14.6652 19.5317 14.7184 19.5834C14.7717 19.6382 14.7826 19.7024 14.7826 19.6774V24.2185C14.7826 24.6256 14.9314 25.0453 15.2258 25.3396C15.5217 25.6356 15.9398 25.7844 16.3485 25.7844H21.0462C21.4549 25.7844 21.873 25.6356 22.169 25.3396C22.4634 25.0453 22.6121 24.6272 22.6121 24.2185V13.2572L22.609 13.2384C23.2009 13.1899 23.7364 12.8767 23.9979 12.3537C24.2814 11.7868 24.1342 11.007 23.6378 10.5106L23.6237 10.5012L15.1804 2.68114C15.0247 2.52862 14.84 2.40888 14.6372 2.329C14.4344 2.24911 14.2176 2.21071 13.9997 2.21607ZM13.9997 3.78196C14.0608 3.78196 14.1015 3.81641 14.0733 3.78823L14.0827 3.80075L22.5291 11.6177C22.6575 11.7461 22.5871 11.6741 22.5965 11.6537C22.6059 11.6349 22.5871 11.6913 22.4555 11.6913H5.54386C5.41233 11.6913 5.39354 11.6349 5.40293 11.6537C5.41233 11.6741 5.3403 11.7461 5.47026 11.6177L13.9167 3.80075L13.9261 3.78823C13.8979 3.81641 13.9386 3.78196 13.9997 3.78196ZM6.95317 13.2556H21.0462V24.2169H16.3485V19.6758C16.3485 19.181 16.1246 18.777 15.8255 18.4779C15.6707 18.3149 15.4848 18.1847 15.2788 18.0948C15.0728 18.005 14.8508 17.9574 14.6261 17.9549H13.3733C12.877 17.9549 12.4729 18.1788 12.1739 18.4779C12.0111 18.6325 11.8809 18.8182 11.7911 19.0239C11.7013 19.2297 11.6536 19.4513 11.6509 19.6758V24.2169H6.95317V13.2556Z"
                    fill={resolvedColor}
                />
            </Svg>
        );
    }

    if (name === 'hospital') {
        return <HospitalIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'stethoscope') {
        return (
            <StethoscopeIcon
                width={iconWidth}
                height={iconHeight}
                color={color}
                {...props}
            />
        );
    }

    if (name === 'medicalPrescription') {
        return (
            <MedicalPrescriptionIcon
                width={iconWidth}
                height={iconHeight}
                color={color}
                {...props}
            />
        );
    }

    if (name === 'termAndPolicy') {
        return (
            <TermAndPolicyIcon
                width={iconWidth}
                height={iconHeight}
                color={color}
                {...props}
            />
        );
    }

    if (name === 'degree') {
        return <DegreeIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'room') {
        return <RoomIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'medicine') {
        return <MedicineIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'injection') {
        return <InjectionIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'verified') {
        return <VerifiedIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'false') {
        return <FalseIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'doctorMale') {
        return <DoctorMaleIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'calendar') {
        return <CalendarIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'reports') {
        return <ReportsIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'medical') {
        return <MedicalIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'search') {
        return (
            <Svg width={iconWidth} height={iconHeight} viewBox="0 0 28 28" fill="none" {...props}>
                <Path
                    d="M10.5 19.5C15.4706 19.5 19.5 15.4706 19.5 10.5C19.5 5.52944 15.4706 1.5 10.5 1.5C5.52944 1.5 1.5 5.52944 1.5 10.5C1.5 15.4706 5.52944 19.5 10.5 19.5Z"
                    stroke={resolvedColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M17 17L23.5 23.5"
                    stroke={resolvedColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        );
    }
    if (name === 'filter') {
        return <FilterIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'back') {
        return <BackwardIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'forward') {
        return <ForwardIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'user') {
        return <UserIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'home') {
        return <HomeIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'star') {
        return <StarIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'edit') {
        return <EditIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'add') {
        return <AddIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'time') {
        return <TimeIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'logout') {
        return <LogoutIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'lock') {
        return <LockIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'more') {
        return <MoreIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'menu') {
        return <KebabIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'chat') {
        return <ChatIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }
    if (name === 'download') {
        return <DownloadIcon width={iconWidth} height={iconHeight} color={color} {...props} />;
    }

    if (name === 'tabFeed') {
        return (
            <Svg
                width={iconWidth}
                height={iconHeight}
                viewBox="0 0 24 24"
                fill="none"
                {...props}>
                <Path
                    d="M16.8873 1.75818C14.7034 1.75818 12.6668 2.50498 12.0023 4.13167C11.2799 2.50498 9.30128 1.75818 7.11732 1.75818C4.17274 1.75818 1.75818 3.14403 1.75818 5.97226V21.0683H2.93919C3.62518 19.6635 5.29897 18.8279 7.11726 18.8279C9.26293 18.8279 11.0581 20.2963 11.4709 22.2418H12.5225C12.9354 20.2963 14.736 18.8279 16.8818 18.8279C18.7 18.8279 20.1437 19.4502 21.0655 21.0683H22.2418V5.97226C22.2418 3.14403 19.832 1.75818 16.8873 1.75818ZM11.5733 20.2642C10.6131 18.8842 8.97386 17.9744 7.11913 17.9744C5.26446 17.9744 3.67852 18.5108 2.66501 19.8908L2.61166 19.9194V5.86558C2.77169 3.63451 4.75012 2.61166 7.10809 2.61166C9.51716 2.61166 11.4899 3.6096 11.5549 5.90868C11.554 5.94756 11.5558 5.9865 11.5558 6.0256L11.5733 6.72456V20.2642ZM21.3883 6.23898V19.8908C20.4282 18.5108 18.7355 17.9744 16.8809 17.9744C15.0261 17.9744 13.3869 18.8842 12.4267 20.2642V6.0256C12.4267 3.67255 14.4356 2.61166 16.8855 2.61166C19.2434 2.61166 21.2283 3.20777 21.3883 5.43883V6.23898Z"
                    fill={resolvedColor}
                />
                <Path
                    d="M8.01862 11.9019H7.56046V11.4437C7.56046 11.4076 7.53114 11.3783 7.49501 11.3783H7.07612C7.03999 11.3783 7.01067 11.4076 7.01067 11.4437V11.9019H6.55251C6.51638 11.9019 6.48706 11.9312 6.48706 11.9674V12.3862C6.48706 12.4224 6.51638 12.4517 6.55251 12.4517H7.01067V12.9099C7.01067 12.946 7.03999 12.9753 7.07612 12.9753H7.49501C7.53114 12.9753 7.56046 12.946 7.56046 12.9099V12.4517H8.01862C8.05475 12.4517 8.08407 12.4224 8.08407 12.3862V11.9674C8.08407 11.9312 8.05475 11.9019 8.01862 11.9019ZM7.95317 12.3208H7.49501C7.45888 12.3208 7.42956 12.3501 7.42956 12.3862V12.8444H7.14157V12.3862C7.14157 12.3501 7.11225 12.3208 7.07612 12.3208H6.61796V12.0328H7.07612C7.11225 12.0328 7.14157 12.0035 7.14157 11.9674V11.5092H7.42956V11.9674C7.42956 12.0035 7.45888 12.0328 7.49501 12.0328H7.95317V12.3208Z"
                    fill={resolvedColor}
                />
                <Path d="M9.48471 9.91217H9.27527V10.0431H9.48471V9.91217Z" fill={resolvedColor} />
                <Path d="M5.23042 10.187H5.36132V10.043H5.50531V9.91206H5.36132V9.76807H5.23042V9.91206H5.08643V10.043H5.23042V10.187Z" fill={resolvedColor} />
                <Path
                    d="M9.68266 12.3034L9.57761 12.1458C9.48997 12.0143 9.4361 11.8618 9.42183 11.7044L9.36862 11.1188C9.35946 11.0178 9.31312 10.9244 9.23818 10.856C9.16324 10.7876 9.06611 10.7499 8.96466 10.7499H8.1888V10.1838C8.1888 10.034 8.06693 9.91217 7.91717 9.91217H6.65396C6.50421 9.91217 6.38234 10.034 6.38234 10.1838V10.7499H5.60648C5.50503 10.7499 5.4079 10.7876 5.33296 10.856C5.25802 10.9244 5.21174 11.0178 5.20252 11.1188L5.1493 11.7044C5.13504 11.8617 5.0811 12.0143 4.99353 12.1458L4.88848 12.3034C4.76962 12.4816 4.70679 12.6891 4.70679 12.9034V13.9787C4.70679 14.1183 4.82041 14.232 4.96008 14.232H9.61105C9.75073 14.232 9.86435 14.1183 9.86435 13.9787V12.9034C9.86435 12.6891 9.80152 12.4816 9.68266 12.3034ZM6.51324 10.1838C6.51324 10.1062 6.57634 10.0431 6.65396 10.0431H7.91717C7.99473 10.0431 8.05789 10.1062 8.05789 10.1838V10.7499H7.87463V10.389C7.87463 10.2993 7.80165 10.2263 7.71192 10.2263H6.85922C6.76949 10.2263 6.69651 10.2993 6.69651 10.389V10.7499H6.51324V10.1838ZM7.74373 10.7499H6.82741V10.389C6.82741 10.3715 6.84168 10.3572 6.85922 10.3572H7.71192C7.72946 10.3572 7.74373 10.3715 7.74373 10.389V10.7499ZM9.61105 14.1011H4.96008C4.8926 14.1011 4.83769 14.0461 4.83769 13.9787V13.6036H8.12335V13.4727H4.83769V12.9034C4.83769 12.7151 4.89293 12.5326 4.99739 12.376L5.10244 12.2183C5.20212 12.0689 5.26339 11.8952 5.27968 11.7163L5.33289 11.1307C5.34585 10.9883 5.46347 10.8808 5.60648 10.8808H6.44779H6.76196H7.80918H8.12335H8.96466C9.10767 10.8808 9.22528 10.9883 9.23824 11.1307L9.29146 11.7163C9.30775 11.8952 9.36902 12.0689 9.4687 12.2183L9.57375 12.376C9.67821 12.5326 9.73345 12.715 9.73345 12.9034V13.4727H8.33279V13.6036H9.73345V13.9787C9.73345 14.0461 9.67853 14.1011 9.61105 14.1011Z"
                    fill={resolvedColor}
                />
            </Svg>
        );
    }

    // Fallback for unsupported icon names
    return (
        <Svg width={iconWidth} height={iconHeight} viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M4 4H20V20H4V4ZM7 7V17H17V7H7Z"
                fill={resolvedColor}
            />
        </Svg>
    );
}
